"""
Service to sync buyer stock when orders are delivered
"""
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from ..models.order import Order, OrderItem, OrderStatus
from ..models.buyer_stock import BuyerStock, StockMovement, StockMovementType
from ..models.crop import Crop
from ..models.buyer import Buyer
import logging

logger = logging.getLogger(__name__)


def sync_stock_from_order(db: Session, order: Order):
    """
    Sync buyer stock when an order is delivered.
    Creates stock records and purchase movements.
    """
    try:
        # Get buyer
        buyer_profile = db.query(Buyer).filter(Buyer.buyer_id == order.buyer_id).first()
        if not buyer_profile:
            logger.warning(f"Buyer profile not found for order {order.order_id}")
            return
        
        buyer_user_id = buyer_profile.user_id
        
        # Process each order item
        for item in order.order_items:
            # Get crop from listing
            listing = item.listing
            if not listing:
                continue
            
            crop_id = listing.crop_id
            
            # Get crop to get shelf life
            crop = db.query(Crop).filter(Crop.crop_id == crop_id).first()
            if not crop:
                continue
            
            # Get or create stock record
            stock = db.query(BuyerStock).filter(
                BuyerStock.buyer_user_id == buyer_user_id,
                BuyerStock.crop_id == crop_id,
                BuyerStock.is_active == True
            ).first()
            
            if not stock:
                stock = BuyerStock(
                    buyer_user_id=buyer_user_id,
                    crop_id=crop_id,
                    current_quantity_kg=0.0,
                    reserved_quantity_kg=0.0,
                    unit_cost_usd=item.unit_price,
                    is_active=True
                )
                db.add(stock)
                db.flush()
            
            # Calculate expiry date if crop has perishability info
            purchase_date = order.actual_delivery_date or datetime.utcnow()
            expiry_date = None
            shelf_life_days = None
            
            if crop.perishability_days:
                shelf_life_days = crop.perishability_days
                expiry_date = purchase_date + timedelta(days=crop.perishability_days)
                stock.shelf_life_days = shelf_life_days
                stock.expiry_date = expiry_date
            
            # Update stock quantity
            delivered_qty = item.delivered_kg if item.delivered_kg > 0 else item.qty_kg
            stock.current_quantity_kg += delivered_qty
            
            # Update stock value
            if stock.unit_cost_usd:
                stock.total_value_usd = stock.current_quantity_kg * stock.unit_cost_usd
            
            stock.purchase_date = purchase_date
            stock.supplier_order_id = order.order_id
            stock.last_movement_date = datetime.utcnow()
            
            # Create purchase movement
            movement = StockMovement(
                stock_id=stock.stock_id,
                buyer_user_id=buyer_user_id,
                crop_id=crop_id,
                movement_type=StockMovementType.PURCHASE,
                quantity_kg=delivered_qty,
                unit_cost_usd=item.unit_price,
                total_cost_usd=item.unit_price * delivered_qty,
                order_id=order.order_id,
                order_item_id=item.order_item_id,
                notes=f"Stock received from order {order.order_number}",
                movement_date=purchase_date
            )
            
            db.add(movement)
            
            logger.info(f"Stock synced for buyer {buyer_user_id}, crop {crop_id}, qty {delivered_qty}kg")
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Error syncing stock from order {order.order_id}: {e}")
        db.rollback()
        raise


def record_consumption(
    db: Session,
    buyer_user_id: int,
    crop_id: int,
    quantity_kg: float,
    notes: Optional[str] = None
):
    """
    Record stock consumption (usage/sale)
    """
    try:
        stock = db.query(BuyerStock).filter(
            BuyerStock.buyer_user_id == buyer_user_id,
            BuyerStock.crop_id == crop_id,
            BuyerStock.is_active == True
        ).first()
        
        if not stock:
            logger.warning(f"Stock not found for buyer {buyer_user_id}, crop {crop_id}")
            return
        
        # Update stock quantity
        stock.current_quantity_kg = max(0, stock.current_quantity_kg - quantity_kg)
        
        # Update stock value
        if stock.unit_cost_usd:
            stock.total_value_usd = stock.current_quantity_kg * stock.unit_cost_usd
        
        # Mark as inactive if empty
        if stock.current_quantity_kg <= 0:
            stock.is_active = False
            if stock.expiry_date and stock.expiry_date < datetime.utcnow():
                stock.is_expired = True
        
        stock.last_movement_date = datetime.utcnow()
        
        # Create consumption movement
        movement = StockMovement(
            stock_id=stock.stock_id,
            buyer_user_id=buyer_user_id,
            crop_id=crop_id,
            movement_type=StockMovementType.CONSUMPTION,
            quantity_kg=-abs(quantity_kg),  # Negative for consumption
            unit_cost_usd=stock.unit_cost_usd,
            total_cost_usd=stock.unit_cost_usd * quantity_kg if stock.unit_cost_usd else None,
            notes=notes or "Stock consumed",
            movement_date=datetime.utcnow()
        )
        
        db.add(movement)
        db.commit()
        
        logger.info(f"Consumption recorded for buyer {buyer_user_id}, crop {crop_id}, qty {quantity_kg}kg")
        
    except Exception as e:
        logger.error(f"Error recording consumption: {e}")
        db.rollback()
        raise


def record_waste(
    db: Session,
    buyer_user_id: int,
    crop_id: int,
    quantity_kg: float,
    notes: Optional[str] = None
):
    """
    Record stock waste (expired/damaged)
    """
    try:
        stock = db.query(BuyerStock).filter(
            BuyerStock.buyer_user_id == buyer_user_id,
            BuyerStock.crop_id == crop_id,
            BuyerStock.is_active == True
        ).first()
        
        if not stock:
            logger.warning(f"Stock not found for buyer {buyer_user_id}, crop {crop_id}")
            return
        
        # Update stock quantity
        stock.current_quantity_kg = max(0, stock.current_quantity_kg - quantity_kg)
        
        # Update stock value
        if stock.unit_cost_usd:
            stock.total_value_usd = stock.current_quantity_kg * stock.unit_cost_usd
        
        # Mark as inactive if empty
        if stock.current_quantity_kg <= 0:
            stock.is_active = False
            stock.is_expired = True
        
        stock.last_movement_date = datetime.utcnow()
        
        # Create waste movement
        movement = StockMovement(
            stock_id=stock.stock_id,
            buyer_user_id=buyer_user_id,
            crop_id=crop_id,
            movement_type=StockMovementType.WASTE,
            quantity_kg=-abs(quantity_kg),  # Negative for waste
            unit_cost_usd=stock.unit_cost_usd,
            total_cost_usd=stock.unit_cost_usd * quantity_kg if stock.unit_cost_usd else None,
            notes=notes or "Stock expired/damaged",
            movement_date=datetime.utcnow()
        )
        
        db.add(movement)
        db.commit()
        
        logger.info(f"Waste recorded for buyer {buyer_user_id}, crop {crop_id}, qty {quantity_kg}kg")
        
    except Exception as e:
        logger.error(f"Error recording waste: {e}")
        db.rollback()
        raise


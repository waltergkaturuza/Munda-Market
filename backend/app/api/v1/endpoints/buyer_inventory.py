from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import json

from ....core.database import get_db
from ....core.auth import get_current_active_user, require_buyer
from ....models.user import User, UserRole
from ....models.buyer import Buyer
from ....models.buyer_stock import (
    BuyerStock,
    StockMovement,
    StockMovementType,
    SalesIntensityCode
)
from ....models.crop import Crop
from ....models.order import Order, OrderItem, OrderStatus
from ....models.buyer_inventory import BuyerInventoryPreference

router = APIRouter()


# ============= Pydantic Models =============
class StockDashboardMetrics(BaseModel):
    total_stock_value: float
    total_items: int
    items_low_stock: int
    items_expiring_soon: int
    items_expired: int
    total_quantity_kg: float
    average_days_cover: float


class StockItemResponse(BaseModel):
    stock_id: int
    crop_id: int
    crop_name: str
    current_quantity_kg: float
    reserved_quantity_kg: float
    available_quantity_kg: float
    reorder_point_kg: Optional[float]
    safety_stock_kg: Optional[float]
    days_of_stock_cover: Optional[float]
    stock_status: str  # "safe", "low", "critical", "reorder"
    expiry_date: Optional[datetime]
    days_until_expiry: Optional[int]
    expiry_status: str  # "fresh", "approaching", "expired"
    unit_cost_usd: Optional[float]
    total_value_usd: Optional[float]
    sales_intensity_code: Optional[str]
    inventory_turnover: Optional[float]
    days_of_inventory: Optional[float]
    last_movement_date: Optional[datetime]


class StockMovementCreate(BaseModel):
    crop_id: int
    movement_type: StockMovementType
    quantity_kg: float = Field(..., gt=0)
    unit_cost_usd: Optional[float] = None
    order_id: Optional[int] = None
    notes: Optional[str] = None
    purchase_date: Optional[datetime] = None
    shelf_life_days: Optional[int] = None
    batch_number: Optional[str] = None


class ReorderPointCalculation(BaseModel):
    crop_id: int
    average_daily_usage_kg: float
    lead_time_days: int
    safety_stock_kg: float
    calculated_reorder_point_kg: float
    minimum_stock_cover_days: Optional[int] = None


class SalesIntensityAnalysis(BaseModel):
    crop_id: int
    crop_name: str
    inventory_turnover: float
    days_of_inventory: float
    sales_intensity_code: str
    total_consumption_kg: float
    average_daily_consumption_kg: float
    days_to_sellout: Optional[float]
    recommendation: str


# ============= Stock Dashboard =============
@router.get("/dashboard/metrics", response_model=StockDashboardMetrics)
async def get_stock_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get overall stock dashboard metrics"""
    
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")
    
    # Get all active stock items
    stocks = db.query(BuyerStock).filter(
        BuyerStock.buyer_user_id == current_user.user_id,
        BuyerStock.is_active == True
    ).all()
    
    total_stock_value = sum(s.total_value_usd or 0.0 for s in stocks)
    total_quantity_kg = sum(s.current_quantity_kg for s in stocks)
    
    # Count items by status
    items_low_stock = 0
    items_expiring_soon = 0
    items_expired = 0
    
    total_days_cover = 0
    items_with_cover = 0
    
    now = datetime.utcnow()
    
    for stock in stocks:
        # Check stock level
        if stock.reorder_point_kg and stock.current_quantity_kg <= stock.reorder_point_kg:
            items_low_stock += 1
        
        # Check expiry
        if stock.expiry_date:
            days_until_expiry = (stock.expiry_date - now).days
            if days_until_expiry < 0:
                items_expired += 1
            elif days_until_expiry <= 2:
                items_expiring_soon += 1
        
        # Calculate days of cover
        if stock.average_daily_usage_kg and stock.average_daily_usage_kg > 0:
            days_cover = stock.current_quantity_kg / stock.average_daily_usage_kg
            total_days_cover += days_cover
            items_with_cover += 1
    
    average_days_cover = total_days_cover / items_with_cover if items_with_cover > 0 else 0.0
    
    return StockDashboardMetrics(
        total_stock_value=total_stock_value,
        total_items=len(stocks),
        items_low_stock=items_low_stock,
        items_expiring_soon=items_expiring_soon,
        items_expired=items_expired,
        total_quantity_kg=total_quantity_kg,
        average_days_cover=average_days_cover
    )


@router.get("/stock", response_model=List[StockItemResponse])
async def get_stock_items(
    include_expired: bool = Query(False, description="Include expired items"),
    status_filter: Optional[str] = Query(None, description="Filter by status: safe, low, critical, reorder"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get all stock items for the buyer"""
    
    query = db.query(BuyerStock).filter(
        BuyerStock.buyer_user_id == current_user.user_id
    )
    
    if not include_expired:
        query = query.filter(BuyerStock.is_expired == False)
    
    stocks = query.all()
    result = []
    
    now = datetime.utcnow()
    
    for stock in stocks:
        crop = db.query(Crop).filter(Crop.crop_id == stock.crop_id).first()
        if not crop:
            continue
        
        # Calculate stock status
        stock_status = "safe"
        if stock.reorder_point_kg:
            if stock.current_quantity_kg <= stock.safety_stock_kg if stock.safety_stock_kg else 0:
                stock_status = "critical"
            elif stock.current_quantity_kg <= stock.reorder_point_kg:
                stock_status = "reorder"
            elif stock.current_quantity_kg <= stock.reorder_point_kg * 1.2:
                stock_status = "low"
        
        # Calculate expiry status
        expiry_status = "fresh"
        days_until_expiry = None
        if stock.expiry_date:
            days_until_expiry = (stock.expiry_date - now).days
            if days_until_expiry < 0:
                expiry_status = "expired"
            elif days_until_expiry <= 2:
                expiry_status = "approaching"
            elif days_until_expiry <= 4:
                expiry_status = "approaching"
        
        # Calculate days of stock cover
        days_of_stock_cover = None
        if stock.average_daily_usage_kg and stock.average_daily_usage_kg > 0:
            days_of_stock_cover = stock.current_quantity_kg / stock.average_daily_usage_kg
        
        # Apply status filter
        if status_filter and stock_status != status_filter:
            continue
        
        result.append(StockItemResponse(
            stock_id=stock.stock_id,
            crop_id=stock.crop_id,
            crop_name=crop.name,
            current_quantity_kg=stock.current_quantity_kg,
            reserved_quantity_kg=stock.reserved_quantity_kg,
            available_quantity_kg=stock.current_quantity_kg - stock.reserved_quantity_kg,
            reorder_point_kg=stock.reorder_point_kg,
            safety_stock_kg=stock.safety_stock_kg,
            days_of_stock_cover=days_of_stock_cover,
            stock_status=stock_status,
            expiry_date=stock.expiry_date,
            days_until_expiry=days_until_expiry,
            expiry_status=expiry_status,
            unit_cost_usd=stock.unit_cost_usd,
            total_value_usd=stock.total_value_usd,
            sales_intensity_code=stock.sales_intensity_code.value if stock.sales_intensity_code else None,
            inventory_turnover=stock.inventory_turnover,
            days_of_inventory=stock.days_of_inventory,
            last_movement_date=stock.last_movement_date
        ))
    
    return result


# ============= Stock Movement Management =============
@router.post("/stock/movements", response_model=dict)
async def create_stock_movement(
    movement_data: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Record a stock movement (purchase, consumption, waste, etc.)"""
    
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")
    
    # Get or create stock record
    stock = db.query(BuyerStock).filter(
        BuyerStock.buyer_user_id == current_user.user_id,
        BuyerStock.crop_id == movement_data.crop_id,
        BuyerStock.is_active == True
    ).first()
    
    if not stock:
        # Create new stock record
        crop = db.query(Crop).filter(Crop.crop_id == movement_data.crop_id).first()
        if not crop:
            raise HTTPException(status_code=404, detail="Crop not found")
        
        stock = BuyerStock(
            buyer_user_id=current_user.user_id,
            crop_id=movement_data.crop_id,
            current_quantity_kg=0.0,
            reserved_quantity_kg=0.0,
            unit_cost_usd=movement_data.unit_cost_usd,
            is_active=True
        )
        db.add(stock)
        db.flush()
    
    # Calculate quantity change
    quantity_change = movement_data.quantity_kg
    if movement_data.movement_type in [StockMovementType.CONSUMPTION, StockMovementType.WASTE]:
        quantity_change = -abs(quantity_change)
    
    # Update stock quantity
    stock.current_quantity_kg += quantity_change
    
    # Handle purchase-specific fields
    if movement_data.movement_type == StockMovementType.PURCHASE:
        if movement_data.purchase_date:
            stock.purchase_date = movement_data.purchase_date
        else:
            stock.purchase_date = datetime.utcnow()
        
        if movement_data.shelf_life_days:
            stock.shelf_life_days = movement_data.shelf_life_days
            stock.expiry_date = stock.purchase_date + timedelta(days=movement_data.shelf_life_days)
        
        if movement_data.unit_cost_usd:
            stock.unit_cost_usd = movement_data.unit_cost_usd
        
        if movement_data.batch_number:
            stock.batch_number = movement_data.batch_number
        
        if movement_data.order_id:
            stock.supplier_order_id = movement_data.order_id
    
    # Update stock value
    if stock.unit_cost_usd:
        stock.total_value_usd = stock.current_quantity_kg * stock.unit_cost_usd
    
    # Mark as expired if quantity is 0 and expired
    if stock.current_quantity_kg <= 0:
        stock.is_active = False
        if stock.expiry_date and stock.expiry_date < datetime.utcnow():
            stock.is_expired = True
    
    stock.last_movement_date = datetime.utcnow()
    
    # Create movement record
    movement = StockMovement(
        stock_id=stock.stock_id,
        buyer_user_id=current_user.user_id,
        crop_id=movement_data.crop_id,
        movement_type=movement_data.movement_type,
        quantity_kg=movement_data.quantity_kg,
        unit_cost_usd=movement_data.unit_cost_usd,
        total_cost_usd=movement_data.unit_cost_usd * movement_data.quantity_kg if movement_data.unit_cost_usd else None,
        order_id=movement_data.order_id,
        notes=movement_data.notes,
        movement_date=movement_data.purchase_date or datetime.utcnow()
    )
    
    db.add(movement)
    db.commit()
    db.refresh(stock)
    
    return {
        "message": "Stock movement recorded",
        "stock_id": stock.stock_id,
        "new_quantity_kg": stock.current_quantity_kg,
        "movement_id": movement.movement_id
    }


# ============= Reorder Point Calculation =============
@router.post("/stock/calculate-reorder-point", response_model=ReorderPointCalculation)
async def calculate_reorder_point(
    crop_id: int,
    lead_time_days: Optional[int] = Query(None, description="Lead time in days (default from preference)"),
    safety_stock_days: Optional[int] = Query(None, description="Safety stock in days (default 2)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Calculate reorder point for a crop"""
    
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")
    
    # Get consumption history (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # Calculate average daily usage from consumption movements
    consumption_movements = db.query(func.sum(StockMovement.quantity_kg)).filter(
        StockMovement.buyer_user_id == current_user.user_id,
        StockMovement.crop_id == crop_id,
        StockMovement.movement_type == StockMovementType.CONSUMPTION,
        StockMovement.movement_date >= thirty_days_ago
    ).scalar()
    
    total_consumption_kg = float(consumption_movements) if consumption_movements else 0.0
    average_daily_usage_kg = total_consumption_kg / 30.0
    
    # Get preference for lead time
    preference = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.buyer_user_id == current_user.user_id,
        BuyerInventoryPreference.crop_id == crop_id
    ).first()
    
    lead_time = lead_time_days or 3  # Default 3 days
    safety_stock_days_value = safety_stock_days or 2  # Default 2 days safety stock
    
    safety_stock_kg = average_daily_usage_kg * safety_stock_days_value
    reorder_point_kg = (average_daily_usage_kg * lead_time) + safety_stock_kg
    
    # Update stock record if exists
    stock = db.query(BuyerStock).filter(
        BuyerStock.buyer_user_id == current_user.user_id,
        BuyerStock.crop_id == crop_id,
        BuyerStock.is_active == True
    ).first()
    
    if stock:
        stock.average_daily_usage_kg = average_daily_usage_kg
        stock.lead_time_days = lead_time
        stock.safety_stock_kg = safety_stock_kg
        stock.reorder_point_kg = reorder_point_kg
        db.commit()
    
    return ReorderPointCalculation(
        crop_id=crop_id,
        average_daily_usage_kg=average_daily_usage_kg,
        lead_time_days=lead_time,
        safety_stock_kg=safety_stock_kg,
        calculated_reorder_point_kg=reorder_point_kg,
        minimum_stock_cover_days=preference.minimum_stock_threshold_kg / average_daily_usage_kg if preference and average_daily_usage_kg > 0 else None
    )


# ============= Sales Intensity Analysis =============
@router.get("/stock/sales-intensity", response_model=List[SalesIntensityAnalysis])
async def get_sales_intensity_analysis(
    days: int = Query(30, description="Analysis period in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get sales intensity analysis for all stocked items"""
    
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")
    
    # Get all active stocks
    stocks = db.query(BuyerStock).filter(
        BuyerStock.buyer_user_id == current_user.user_id,
        BuyerStock.is_active == True
    ).all()
    
    result = []
    analysis_start = datetime.utcnow() - timedelta(days=days)
    
    for stock in stocks:
        crop = db.query(Crop).filter(Crop.crop_id == stock.crop_id).first()
        if not crop:
            continue
        
        # Get consumption movements
        consumption_movements = db.query(StockMovement).filter(
            StockMovement.buyer_user_id == current_user.user_id,
            StockMovement.crop_id == stock.crop_id,
            StockMovement.movement_type == StockMovementType.CONSUMPTION,
            StockMovement.movement_date >= analysis_start
        ).all()
        
        total_consumption_kg = sum(abs(m.quantity_kg) for m in consumption_movements)
        average_daily_consumption_kg = total_consumption_kg / days if days > 0 else 0.0
        
        # Calculate inventory turnover
        # Get average inventory (simplified: use current stock as average)
        average_inventory_kg = stock.current_quantity_kg
        
        # Cost of goods sold (simplified: use consumption * unit cost)
        cost_of_goods_sold = total_consumption_kg * (stock.unit_cost_usd or 0.0)
        
        inventory_turnover = 0.0
        days_of_inventory = 0.0
        days_to_sellout = None
        
        if average_inventory_kg > 0 and stock.unit_cost_usd and stock.unit_cost_usd > 0:
            inventory_turnover = cost_of_goods_sold / (average_inventory_kg * stock.unit_cost_usd)
            days_of_inventory = 365.0 / inventory_turnover if inventory_turnover > 0 else 0.0
        
        if average_daily_consumption_kg > 0:
            days_to_sellout = stock.current_quantity_kg / average_daily_consumption_kg
        
        # Classify sales intensity
        sales_intensity_code = SalesIntensityCode.D
        recommendation = "Consider promotions or reducing order quantity"
        
        if days_to_sellout:
            if days_to_sellout < 3:
                sales_intensity_code = SalesIntensityCode.A
                recommendation = "Fast moving - prioritize reorder"
            elif days_to_sellout <= 7:
                sales_intensity_code = SalesIntensityCode.B
                recommendation = "Normal moving - maintain regular orders"
            elif days_to_sellout > 7:
                sales_intensity_code = SalesIntensityCode.C
                recommendation = "Slow moving - review ordering frequency"
        
        # Update stock record
        stock.inventory_turnover = inventory_turnover
        stock.days_of_inventory = days_of_inventory
        stock.sales_intensity_code = sales_intensity_code
        db.commit()
        
        result.append(SalesIntensityAnalysis(
            crop_id=stock.crop_id,
            crop_name=crop.name,
            inventory_turnover=inventory_turnover,
            days_of_inventory=days_of_inventory,
            sales_intensity_code=sales_intensity_code.value,
            total_consumption_kg=total_consumption_kg,
            average_daily_consumption_kg=average_daily_consumption_kg,
            days_to_sellout=days_to_sellout,
            recommendation=recommendation
        ))
    
    return result


# ============= Stock Movements History =============
@router.get("/stock/movements", response_model=List[dict])
async def get_stock_movements(
    crop_id: Optional[int] = Query(None),
    movement_type: Optional[StockMovementType] = Query(None),
    days: int = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get stock movement history"""
    
    query = db.query(StockMovement).filter(
        StockMovement.buyer_user_id == current_user.user_id
    )
    
    if crop_id:
        query = query.filter(StockMovement.crop_id == crop_id)
    
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(StockMovement.movement_date >= start_date)
    
    movements = query.order_by(desc(StockMovement.movement_date)).limit(100).all()
    
    result = []
    for movement in movements:
        crop = db.query(Crop).filter(Crop.crop_id == movement.crop_id).first()
        result.append({
            "movement_id": movement.movement_id,
            "crop_id": movement.crop_id,
            "crop_name": crop.name if crop else None,
            "movement_type": movement.movement_type.value,
            "quantity_kg": movement.quantity_kg,
            "unit_cost_usd": movement.unit_cost_usd,
            "total_cost_usd": movement.total_cost_usd,
            "movement_date": movement.movement_date.isoformat(),
            "notes": movement.notes,
            "order_id": movement.order_id
        })
    
    return result


# ============= Auto Reorder Suggestions =============
@router.get("/stock/reorder-suggestions", response_model=List[dict])
async def get_reorder_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get automated reorder suggestions based on stock levels and ROP"""
    
    buyer = db.query(Buyer).filter(Buyer.user_id == current_user.user_id).first()
    if not buyer:
        raise HTTPException(status_code=404, detail="Buyer profile not found")
    
    # Get stocks that are at or below reorder point
    stocks = db.query(BuyerStock).filter(
        BuyerStock.buyer_user_id == current_user.user_id,
        BuyerStock.is_active == True,
        BuyerStock.reorder_point_kg.isnot(None),
        BuyerStock.current_quantity_kg <= BuyerStock.reorder_point_kg
    ).all()
    
    result = []
    for stock in stocks:
        crop = db.query(Crop).filter(Crop.crop_id == stock.crop_id).first()
        if not crop:
            continue
        
        # Calculate suggested reorder quantity
        # Based on minimum stock cover days
        suggested_reorder_kg = 0.0
        if stock.average_daily_usage_kg and stock.minimum_stock_cover_days:
            target_stock_kg = stock.average_daily_usage_kg * stock.minimum_stock_cover_days
            suggested_reorder_kg = max(0, target_stock_kg - stock.current_quantity_kg)
        
        # Get preference for reorder quantity
        preference = db.query(BuyerInventoryPreference).filter(
            BuyerInventoryPreference.buyer_user_id == current_user.user_id,
            BuyerInventoryPreference.crop_id == stock.crop_id
        ).first()
        
        if preference and preference.reorder_quantity_kg:
            suggested_reorder_kg = preference.reorder_quantity_kg
        
        # Calculate days until stockout
        days_until_stockout = None
        if stock.average_daily_usage_kg and stock.average_daily_usage_kg > 0:
            days_until_stockout = stock.current_quantity_kg / stock.average_daily_usage_kg
        
        result.append({
            "crop_id": stock.crop_id,
            "crop_name": crop.name,
            "current_stock_kg": stock.current_quantity_kg,
            "reorder_point_kg": stock.reorder_point_kg,
            "safety_stock_kg": stock.safety_stock_kg,
            "suggested_reorder_kg": suggested_reorder_kg,
            "days_until_stockout": days_until_stockout,
            "average_daily_usage_kg": stock.average_daily_usage_kg,
            "urgency": "critical" if days_until_stockout and days_until_stockout < 1 else "high" if days_until_stockout and days_until_stockout < 3 else "medium"
        })
    
    return result


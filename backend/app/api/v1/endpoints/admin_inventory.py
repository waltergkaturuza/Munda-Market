from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timedelta
from pydantic import BaseModel

from ....core.database import get_db
from ....core.auth import require_staff
from ....models.user import User, UserRole
from ....models.buyer import Buyer
from ....models.buyer_stock import BuyerStock, StockMovement, StockMovementType, SalesIntensityCode
from ....models.crop import Crop
from ....models.order import Order, OrderStatus

router = APIRouter()


# ============= Pydantic Models =============
class AdminInventoryMetrics(BaseModel):
    total_buyers_with_stock: int
    total_stock_items: int
    total_stock_value: float
    total_quantity_kg: float
    items_low_stock: int
    items_expiring_soon: int
    items_expired: int
    total_movements_today: int
    total_movements_week: int
    average_days_cover: float


class BuyerStockSummary(BaseModel):
    buyer_id: int
    buyer_name: str
    buyer_company: Optional[str]
    total_items: int
    total_stock_value: float
    total_quantity_kg: float
    items_low_stock: int
    items_expiring_soon: int
    items_expired: int
    last_movement_date: Optional[datetime]


class AdminStockItemResponse(BaseModel):
    stock_id: int
    buyer_id: int
    buyer_name: str
    buyer_company: Optional[str]
    crop_id: int
    crop_name: str
    current_quantity_kg: float
    reorder_point_kg: Optional[float]
    days_of_stock_cover: Optional[float]
    stock_status: str
    expiry_date: Optional[datetime]
    days_until_expiry: Optional[int]
    expiry_status: str
    total_value_usd: Optional[float]
    sales_intensity_code: Optional[str]
    inventory_turnover: Optional[float]
    last_movement_date: Optional[datetime]


class AdminStockMovementResponse(BaseModel):
    movement_id: int
    buyer_id: int
    buyer_name: str
    buyer_company: Optional[str]
    crop_id: int
    crop_name: str
    movement_type: str
    quantity_kg: float
    unit_cost_usd: Optional[float]
    total_cost_usd: Optional[float]
    movement_date: datetime
    notes: Optional[str]
    order_id: Optional[int]


# ============= Admin Inventory Dashboard Metrics =============
@router.get("/admin/inventory/metrics", response_model=AdminInventoryMetrics)
async def get_admin_inventory_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get overall inventory metrics across all buyers"""
    
    # Get all active stock items
    stocks = db.query(BuyerStock).filter(BuyerStock.is_active == True).all()
    
    # Get unique buyers with stock
    buyer_ids = list(set([s.buyer_user_id for s in stocks]))
    total_buyers_with_stock = len(buyer_ids)
    
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
    
    # Get movement counts
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    
    total_movements_today = db.query(StockMovement).filter(
        StockMovement.movement_date >= today_start
    ).count()
    
    total_movements_week = db.query(StockMovement).filter(
        StockMovement.movement_date >= week_start
    ).count()
    
    return AdminInventoryMetrics(
        total_buyers_with_stock=total_buyers_with_stock,
        total_stock_items=len(stocks),
        total_stock_value=total_stock_value,
        total_quantity_kg=total_quantity_kg,
        items_low_stock=items_low_stock,
        items_expiring_soon=items_expiring_soon,
        items_expired=items_expired,
        total_movements_today=total_movements_today,
        total_movements_week=total_movements_week,
        average_days_cover=average_days_cover
    )


# ============= Buyer Stock Summaries =============
@router.get("/admin/inventory/buyers", response_model=List[BuyerStockSummary])
async def get_buyer_stock_summaries(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get stock summary for each buyer"""
    
    # Get all buyers with stock
    buyer_ids = db.query(BuyerStock.buyer_user_id).distinct().all()
    buyer_ids = [b[0] for b in buyer_ids]
    
    result = []
    now = datetime.utcnow()
    
    for buyer_user_id in buyer_ids:
        buyer_user = db.query(User).filter(User.user_id == buyer_user_id).first()
        if not buyer_user:
            continue
        
        buyer_profile = db.query(Buyer).filter(Buyer.user_id == buyer_user_id).first()
        
        # Get all stocks for this buyer
        stocks = db.query(BuyerStock).filter(
            BuyerStock.buyer_user_id == buyer_user_id,
            BuyerStock.is_active == True
        ).all()
        
        total_stock_value = sum(s.total_value_usd or 0.0 for s in stocks)
        total_quantity_kg = sum(s.current_quantity_kg for s in stocks)
        
        items_low_stock = 0
        items_expiring_soon = 0
        items_expired = 0
        
        last_movement_date = None
        
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
            
            # Track last movement
            if stock.last_movement_date:
                if not last_movement_date or stock.last_movement_date > last_movement_date:
                    last_movement_date = stock.last_movement_date
        
        result.append(BuyerStockSummary(
            buyer_id=buyer_profile.buyer_id if buyer_profile else buyer_user_id,
            buyer_name=buyer_user.name,
            buyer_company=buyer_profile.company_name if buyer_profile else None,
            total_items=len(stocks),
            total_stock_value=total_stock_value,
            total_quantity_kg=total_quantity_kg,
            items_low_stock=items_low_stock,
            items_expiring_soon=items_expiring_soon,
            items_expired=items_expired,
            last_movement_date=last_movement_date
        ))
    
    return result


# ============= All Stock Items (Admin View) =============
@router.get("/admin/inventory/stock-items", response_model=List[AdminStockItemResponse])
async def get_all_stock_items(
    buyer_id: Optional[int] = Query(None, description="Filter by buyer"),
    crop_id: Optional[int] = Query(None, description="Filter by crop"),
    status_filter: Optional[str] = Query(None, description="Filter by status: safe, low, critical, reorder"),
    include_expired: bool = Query(False, description="Include expired items"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all stock items across all buyers (admin view)"""
    
    query = db.query(BuyerStock)
    
    if buyer_id:
        buyer_profile = db.query(Buyer).filter(Buyer.buyer_id == buyer_id).first()
        if buyer_profile:
            query = query.filter(BuyerStock.buyer_user_id == buyer_profile.user_id)
    
    if crop_id:
        query = query.filter(BuyerStock.crop_id == crop_id)
    
    if not include_expired:
        query = query.filter(BuyerStock.is_expired == False)
    
    stocks = query.all()
    result = []
    
    now = datetime.utcnow()
    
    for stock in stocks:
        buyer_user = db.query(User).filter(User.user_id == stock.buyer_user_id).first()
        if not buyer_user:
            continue
        
        buyer_profile = db.query(Buyer).filter(Buyer.user_id == stock.buyer_user_id).first()
        
        crop = db.query(Crop).filter(Crop.crop_id == stock.crop_id).first()
        if not crop:
            continue
        
        # Calculate stock status
        stock_status = "safe"
        if stock.reorder_point_kg:
            if stock.current_quantity_kg <= (stock.safety_stock_kg if stock.safety_stock_kg else 0):
                stock_status = "critical"
            elif stock.current_quantity_kg <= stock.reorder_point_kg:
                stock_status = "reorder"
            elif stock.current_quantity_kg <= stock.reorder_point_kg * 1.2:
                stock_status = "low"
        
        # Apply status filter
        if status_filter and stock_status != status_filter:
            continue
        
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
        
        result.append(AdminStockItemResponse(
            stock_id=stock.stock_id,
            buyer_id=buyer_profile.buyer_id if buyer_profile else stock.buyer_user_id,
            buyer_name=buyer_user.name,
            buyer_company=buyer_profile.company_name if buyer_profile else None,
            crop_id=stock.crop_id,
            crop_name=crop.name,
            current_quantity_kg=stock.current_quantity_kg,
            reorder_point_kg=stock.reorder_point_kg,
            days_of_stock_cover=days_of_stock_cover,
            stock_status=stock_status,
            expiry_date=stock.expiry_date,
            days_until_expiry=days_until_expiry,
            expiry_status=expiry_status,
            total_value_usd=stock.total_value_usd,
            sales_intensity_code=stock.sales_intensity_code.value if stock.sales_intensity_code else None,
            inventory_turnover=stock.inventory_turnover,
            last_movement_date=stock.last_movement_date
        ))
    
    return result


# ============= All Stock Movements (Admin View) =============
@router.get("/admin/inventory/movements", response_model=List[AdminStockMovementResponse])
async def get_all_stock_movements(
    buyer_id: Optional[int] = Query(None),
    crop_id: Optional[int] = Query(None),
    movement_type: Optional[StockMovementType] = Query(None),
    days: int = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get all stock movements across all buyers (admin view)"""
    
    query = db.query(StockMovement)
    
    if buyer_id:
        buyer_profile = db.query(Buyer).filter(Buyer.buyer_id == buyer_id).first()
        if buyer_profile:
            query = query.filter(StockMovement.buyer_user_id == buyer_profile.user_id)
    
    if crop_id:
        query = query.filter(StockMovement.crop_id == crop_id)
    
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(StockMovement.movement_date >= start_date)
    
    movements = query.order_by(desc(StockMovement.movement_date)).limit(500).all()
    
    result = []
    for movement in movements:
        buyer_user = db.query(User).filter(User.user_id == movement.buyer_user_id).first()
        if not buyer_user:
            continue
        
        buyer_profile = db.query(Buyer).filter(Buyer.user_id == movement.buyer_user_id).first()
        
        crop = db.query(Crop).filter(Crop.crop_id == movement.crop_id).first()
        if not crop:
            continue
        
        result.append(AdminStockMovementResponse(
            movement_id=movement.movement_id,
            buyer_id=buyer_profile.buyer_id if buyer_profile else movement.buyer_user_id,
            buyer_name=buyer_user.name,
            buyer_company=buyer_profile.company_name if buyer_profile else None,
            crop_id=movement.crop_id,
            crop_name=crop.name,
            movement_type=movement.movement_type.value,
            quantity_kg=movement.quantity_kg,
            unit_cost_usd=movement.unit_cost_usd,
            total_cost_usd=movement.total_cost_usd,
            movement_date=movement.movement_date,
            notes=movement.notes,
            order_id=movement.order_id
        ))
    
    return result


# ============= Sales Intensity Analysis (All Buyers) =============
@router.get("/admin/inventory/sales-intensity", response_model=List[dict])
async def get_all_sales_intensity(
    days: int = Query(30, description="Analysis period in days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff)
):
    """Get sales intensity analysis aggregated across all buyers"""
    
    # Get all active stocks
    stocks = db.query(BuyerStock).filter(BuyerStock.is_active == True).all()
    
    # Group by crop
    crop_stocks = {}
    for stock in stocks:
        if stock.crop_id not in crop_stocks:
            crop_stocks[stock.crop_id] = []
        crop_stocks[stock.crop_id].append(stock)
    
    result = []
    analysis_start = datetime.utcnow() - timedelta(days=days)
    
    for crop_id, crop_stock_list in crop_stocks.items():
        crop = db.query(Crop).filter(Crop.crop_id == crop_id).first()
        if not crop:
            continue
        
        # Aggregate across all buyers
        total_consumption_kg = 0.0
        total_stock_kg = 0.0
        total_value = 0.0
        total_turnover = 0.0
        total_days_inventory = 0.0
        buyers_count = 0
        
        for stock in crop_stock_list:
            # Get consumption movements for this buyer/crop
            consumption_movements = db.query(StockMovement).filter(
                StockMovement.buyer_user_id == stock.buyer_user_id,
                StockMovement.crop_id == crop_id,
                StockMovement.movement_type == StockMovementType.CONSUMPTION,
                StockMovement.movement_date >= analysis_start
            ).all()
            
            buyer_consumption = sum(abs(m.quantity_kg) for m in consumption_movements)
            total_consumption_kg += buyer_consumption
            
            total_stock_kg += stock.current_quantity_kg
            total_value += stock.total_value_usd or 0.0
            
            if stock.inventory_turnover:
                total_turnover += stock.inventory_turnover
                buyers_count += 1
            
            if stock.days_of_inventory:
                total_days_inventory += stock.days_of_inventory
        
        average_daily_consumption_kg = total_consumption_kg / days if days > 0 else 0.0
        average_turnover = total_turnover / buyers_count if buyers_count > 0 else 0.0
        average_days_inventory = total_days_inventory / buyers_count if buyers_count > 0 else 0.0
        
        # Calculate days to sellout
        days_to_sellout = None
        if average_daily_consumption_kg > 0:
            days_to_sellout = total_stock_kg / average_daily_consumption_kg
        
        # Classify sales intensity
        sales_intensity_code = "D"
        recommendation = "Consider promotions or reducing order quantity"
        
        if days_to_sellout:
            if days_to_sellout < 3:
                sales_intensity_code = "A"
                recommendation = "Fast moving - high demand product"
            elif days_to_sellout <= 7:
                sales_intensity_code = "B"
                recommendation = "Normal moving - stable demand"
            elif days_to_sellout > 7:
                sales_intensity_code = "C"
                recommendation = "Slow moving - review demand"
        
        result.append({
            "crop_id": crop_id,
            "crop_name": crop.name,
            "total_buyers": len(crop_stock_list),
            "total_consumption_kg": total_consumption_kg,
            "average_daily_consumption_kg": average_daily_consumption_kg,
            "total_stock_kg": total_stock_kg,
            "total_value_usd": total_value,
            "average_inventory_turnover": average_turnover,
            "average_days_of_inventory": average_days_inventory,
            "days_to_sellout": days_to_sellout,
            "sales_intensity_code": sales_intensity_code,
            "recommendation": recommendation
        })
    
    return result


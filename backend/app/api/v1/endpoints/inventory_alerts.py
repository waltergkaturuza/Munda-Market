from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import json

from ....core.database import get_db
from ....core.auth import get_current_active_user, require_buyer
from ....models.user import User, UserRole
from ....models.buyer_inventory import (
    BuyerInventoryPreference,
    InventoryAlert,
    AlertSeverity,
    AlertStatus
)
from ....models.crop import Crop
from ....models.production import Lot, ProductionPlan
from ....models.pricing import Listing
from ....models.order import Order, OrderItem, OrderStatus

router = APIRouter()


# ============= Pydantic Models =============
class InventoryPreferenceCreate(BaseModel):
    crop_id: int
    min_stock_threshold_kg: float = Field(..., gt=0)
    reorder_quantity_kg: Optional[float] = None
    max_stock_threshold_kg: Optional[float] = None
    days_before_harvest_alert: int = Field(default=7, ge=0)
    days_after_harvest_alert: int = Field(default=3, ge=0)
    enable_low_stock_alerts: bool = True
    enable_harvest_alerts: bool = True
    enable_price_alerts: bool = False
    alert_frequency: str = "daily"
    notification_channels: Optional[dict] = None
    is_favorite: bool = False
    priority: int = Field(default=0, ge=0)


class InventoryPreferenceUpdate(BaseModel):
    min_stock_threshold_kg: Optional[float] = Field(None, gt=0)
    reorder_quantity_kg: Optional[float] = None
    max_stock_threshold_kg: Optional[float] = None
    days_before_harvest_alert: Optional[int] = Field(None, ge=0)
    days_after_harvest_alert: Optional[int] = Field(None, ge=0)
    enable_low_stock_alerts: Optional[bool] = None
    enable_harvest_alerts: Optional[bool] = None
    enable_price_alerts: Optional[bool] = None
    alert_frequency: Optional[str] = None
    notification_channels: Optional[dict] = None
    is_favorite: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=0)


class InventoryPreferenceResponse(BaseModel):
    preference_id: int
    buyer_user_id: int
    crop_id: int
    crop_name: Optional[str]
    min_stock_threshold_kg: float
    reorder_quantity_kg: Optional[float]
    max_stock_threshold_kg: Optional[float]
    days_before_harvest_alert: int
    days_after_harvest_alert: int
    enable_low_stock_alerts: bool
    enable_harvest_alerts: bool
    enable_price_alerts: bool
    alert_frequency: str
    notification_channels: Optional[dict]
    is_favorite: bool
    priority: int
    average_monthly_consumption_kg: Optional[float]
    last_order_date: Optional[datetime]
    last_order_quantity_kg: Optional[float]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class InventoryAlertResponse(BaseModel):
    alert_id: int
    buyer_user_id: int
    crop_id: Optional[int]
    crop_name: Optional[str]
    listing_id: Optional[int]
    lot_id: Optional[int]
    alert_type: str
    severity: AlertSeverity
    status: AlertStatus
    title: str
    message: str
    alert_data: Optional[dict]
    action_url: Optional[str]
    action_text: Optional[str]
    acknowledged_at: Optional[datetime]
    resolved_at: Optional[datetime]
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class StockLevelResponse(BaseModel):
    crop_id: int
    crop_name: str
    total_available_kg: float
    total_reserved_kg: float
    total_sold_kg: float
    remaining_kg: float
    min_stock_threshold_kg: Optional[float]
    reorder_quantity_kg: Optional[float]
    alert_level: str  # "ok", "low", "critical"
    next_harvest_date: Optional[datetime]
    days_until_harvest: Optional[int]
    active_listings_count: int


# ============= Inventory Preferences Endpoints =============
@router.post("/preferences", response_model=InventoryPreferenceResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory_preference(
    preference_data: InventoryPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Create or update inventory preference for a crop"""
    
    # Check if preference already exists
    existing = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.buyer_user_id == current_user.user_id,
        BuyerInventoryPreference.crop_id == preference_data.crop_id
    ).first()
    
    if existing:
        # Update existing preference
        update_data = preference_data.dict(exclude_unset=True)
        if 'notification_channels' in update_data and update_data['notification_channels']:
            update_data['notification_channels'] = json.dumps(update_data['notification_channels'])
        
        for field, value in update_data.items():
            setattr(existing, field, value)
        
        db.commit()
        db.refresh(existing)
        preference = existing
    else:
        # Create new preference
        notification_json = None
        if preference_data.notification_channels:
            notification_json = json.dumps(preference_data.notification_channels)
        
        preference = BuyerInventoryPreference(
            buyer_user_id=current_user.user_id,
            crop_id=preference_data.crop_id,
            min_stock_threshold_kg=preference_data.min_stock_threshold_kg,
            reorder_quantity_kg=preference_data.reorder_quantity_kg,
            max_stock_threshold_kg=preference_data.max_stock_threshold_kg,
            days_before_harvest_alert=preference_data.days_before_harvest_alert,
            days_after_harvest_alert=preference_data.days_after_harvest_alert,
            enable_low_stock_alerts=preference_data.enable_low_stock_alerts,
            enable_harvest_alerts=preference_data.enable_harvest_alerts,
            enable_price_alerts=preference_data.enable_price_alerts,
            alert_frequency=preference_data.alert_frequency,
            notification_channels=notification_json,
            is_favorite=preference_data.is_favorite,
            priority=preference_data.priority
        )
        
        db.add(preference)
        db.commit()
        db.refresh(preference)
    
    # Calculate consumption stats
    _update_consumption_stats(db, preference)
    
    response = InventoryPreferenceResponse.model_validate(preference)
    response.crop_name = preference.crop.name if preference.crop else None
    if preference.notification_channels:
        response.notification_channels = json.loads(preference.notification_channels)
    
    return response


@router.get("/preferences", response_model=List[InventoryPreferenceResponse])
async def list_inventory_preferences(
    favorite_only: bool = Query(False, description="Filter to favorites only"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """List all inventory preferences for the current buyer"""
    
    query = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.buyer_user_id == current_user.user_id
    )
    
    if favorite_only:
        query = query.filter(BuyerInventoryPreference.is_favorite == True)
    
    preferences = query.order_by(
        BuyerInventoryPreference.priority.desc(),
        BuyerInventoryPreference.is_favorite.desc(),
        BuyerInventoryPreference.created_at.desc()
    ).all()
    
    result = []
    for pref in preferences:
        response = InventoryPreferenceResponse.model_validate(pref)
        response.crop_name = pref.crop.name if pref.crop else None
        if pref.notification_channels:
            response.notification_channels = json.loads(pref.notification_channels)
        result.append(response)
    
    return result


@router.put("/preferences/{preference_id}", response_model=InventoryPreferenceResponse)
async def update_inventory_preference(
    preference_id: int,
    preference_data: InventoryPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Update an inventory preference"""
    
    preference = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.preference_id == preference_id,
        BuyerInventoryPreference.buyer_user_id == current_user.user_id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory preference not found"
        )
    
    update_data = preference_data.dict(exclude_unset=True)
    if 'notification_channels' in update_data and update_data['notification_channels']:
        update_data['notification_channels'] = json.dumps(update_data['notification_channels'])
    
    for field, value in update_data.items():
        setattr(preference, field, value)
    
    db.commit()
    db.refresh(preference)
    
    # Update consumption stats
    _update_consumption_stats(db, preference)
    
    response = InventoryPreferenceResponse.model_validate(preference)
    response.crop_name = preference.crop.name if preference.crop else None
    if preference.notification_channels:
        response.notification_channels = json.loads(preference.notification_channels)
    
    return response


@router.delete("/preferences/{preference_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_inventory_preference(
    preference_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Delete an inventory preference"""
    
    preference = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.preference_id == preference_id,
        BuyerInventoryPreference.buyer_user_id == current_user.user_id
    ).first()
    
    if not preference:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory preference not found"
        )
    
    db.delete(preference)
    db.commit()
    
    return None


# ============= Alerts Endpoints =============
@router.get("/alerts", response_model=List[InventoryAlertResponse])
async def get_inventory_alerts(
    status_filter: Optional[AlertStatus] = Query(None, description="Filter by alert status"),
    severity_filter: Optional[AlertSeverity] = Query(None, description="Filter by severity"),
    crop_id: Optional[int] = Query(None, description="Filter by crop"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get inventory alerts for the current buyer"""
    
    query = db.query(InventoryAlert).filter(
        InventoryAlert.buyer_user_id == current_user.user_id,
        or_(
            InventoryAlert.expires_at == None,
            InventoryAlert.expires_at > datetime.utcnow()
        )
    )
    
    if status_filter:
        query = query.filter(InventoryAlert.status == status_filter)
    
    if severity_filter:
        query = query.filter(InventoryAlert.severity == severity_filter)
    
    if crop_id:
        query = query.filter(InventoryAlert.crop_id == crop_id)
    
    alerts = query.order_by(
        InventoryAlert.severity.desc(),
        InventoryAlert.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for alert in alerts:
        response = InventoryAlertResponse.model_validate(alert)
        response.crop_name = alert.crop.name if alert.crop else None
        if alert.alert_data:
            response.alert_data = json.loads(alert.alert_data)
        result.append(response)
    
    return result


@router.post("/alerts/{alert_id}/acknowledge", response_model=InventoryAlertResponse)
async def acknowledge_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Acknowledge an alert"""
    
    alert = db.query(InventoryAlert).filter(
        InventoryAlert.alert_id == alert_id,
        InventoryAlert.buyer_user_id == current_user.user_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = current_user.user_id
    
    db.commit()
    db.refresh(alert)
    
    response = InventoryAlertResponse.model_validate(alert)
    response.crop_name = alert.crop.name if alert.crop else None
    if alert.alert_data:
        response.alert_data = json.loads(alert.alert_data)
    
    return response


@router.post("/alerts/{alert_id}/dismiss", response_model=InventoryAlertResponse)
async def dismiss_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Dismiss an alert"""
    
    alert = db.query(InventoryAlert).filter(
        InventoryAlert.alert_id == alert_id,
        InventoryAlert.buyer_user_id == current_user.user_id
    ).first()
    
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    
    alert.status = AlertStatus.DISMISSED
    
    db.commit()
    db.refresh(alert)
    
    response = InventoryAlertResponse.model_validate(alert)
    response.crop_name = alert.crop.name if alert.crop else None
    if alert.alert_data:
        response.alert_data = json.loads(alert.alert_data)
    
    return response


# ============= Stock Levels Endpoint =============
@router.get("/stock-levels", response_model=List[StockLevelResponse])
async def get_stock_levels(
    favorite_only: bool = Query(False, description="Show only favorite crops"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get current stock levels for crops the buyer is monitoring"""
    
    # Get buyer preferences
    query = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.buyer_user_id == current_user.user_id
    )
    
    if favorite_only:
        query = query.filter(BuyerInventoryPreference.is_favorite == True)
    
    preferences = query.all()
    
    if not preferences:
        return []
    
    crop_ids = [p.crop_id for p in preferences]
    
    # Get stock levels for each crop
    result = []
    for pref in preferences:
        crop = pref.crop
        
        # Aggregate stock from all active lots/listings for this crop
        stock_query = db.query(
            func.sum(Lot.available_kg).label('total_available'),
            func.sum(Lot.reserved_kg).label('total_reserved'),
            func.sum(Lot.sold_kg).label('total_sold'),
            func.count(Listing.listing_id).label('listings_count')
        ).join(
            Listing, Listing.lot_id == Lot.lot_id
        ).join(
            ProductionPlan, ProductionPlan.plan_id == Lot.plan_id
        ).filter(
            ProductionPlan.crop_id == crop.crop_id,
            Lot.current_status == "available",
            Listing.is_active == True
        )
        
        stock_data = stock_query.first()
        
        total_available = stock_data.total_available or 0.0
        total_reserved = stock_data.total_reserved or 0.0
        total_sold = stock_data.total_sold or 0.0
        remaining = total_available - total_reserved - total_sold
        listings_count = stock_data.listings_count or 0
        
        # Determine alert level
        min_threshold = pref.min_stock_threshold_kg
        if remaining <= 0:
            alert_level = "critical"
        elif min_threshold and remaining < min_threshold:
            alert_level = "low"
        else:
            alert_level = "ok"
        
        # Get next harvest date
        next_harvest = db.query(ProductionPlan).filter(
            ProductionPlan.crop_id == crop.crop_id,
            ProductionPlan.status.in_(["growing", "harvest_ready", "harvesting"]),
            ProductionPlan.expected_harvest_window_start != None
        ).order_by(ProductionPlan.expected_harvest_window_start.asc()).first()
        
        next_harvest_date = None
        days_until_harvest = None
        if next_harvest and next_harvest.expected_harvest_window_start:
            next_harvest_date = next_harvest.expected_harvest_window_start
            days_until_harvest = (next_harvest_date - datetime.utcnow()).days
        
        result.append(StockLevelResponse(
            crop_id=crop.crop_id,
            crop_name=crop.name,
            total_available_kg=total_available,
            total_reserved_kg=total_reserved,
            total_sold_kg=total_sold,
            remaining_kg=remaining,
            min_stock_threshold_kg=min_threshold,
            reorder_quantity_kg=pref.reorder_quantity_kg,
            alert_level=alert_level,
            next_harvest_date=next_harvest_date,
            days_until_harvest=days_until_harvest,
            active_listings_count=listings_count
        ))
    
    return result


# ============= Stock History Endpoints =============
class StockHistoryResponse(BaseModel):
    history_id: int
    crop_id: int
    crop_name: Optional[str]
    total_available_kg: float
    total_reserved_kg: float
    total_sold_kg: float
    remaining_kg: float
    avg_price_per_kg: Optional[float]
    min_price_per_kg: Optional[float]
    max_price_per_kg: Optional[float]
    active_listings_count: int
    recorded_at: datetime

    class Config:
        from_attributes = True


@router.get("/stock-history/{crop_id}", response_model=List[StockHistoryResponse])
async def get_stock_history(
    crop_id: int,
    days: int = Query(30, ge=1, le=365, description="Number of days of history"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_buyer)
):
    """Get historical stock levels for a crop"""
    from datetime import timedelta
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    from ....models.stock_history import StockHistory
    
    history_records = db.query(StockHistory).filter(
        StockHistory.crop_id == crop_id,
        StockHistory.recorded_at >= cutoff_date
    ).order_by(StockHistory.recorded_at.asc()).all()
    
    result = []
    for record in history_records:
        response = StockHistoryResponse.model_validate(record)
        response.crop_name = record.crop.name if record.crop else None
        result.append(response)
    
    return result


# ============= Helper Functions =============
def _update_consumption_stats(db: Session, preference: BuyerInventoryPreference):
    """Update consumption statistics for a preference based on order history"""
    
    # Calculate average monthly consumption from last 3 months
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    
    orders = db.query(Order).join(OrderItem).join(Listing).join(Lot).join(ProductionPlan).filter(
        Order.buyer_user_id == preference.buyer_user_id,
        ProductionPlan.crop_id == preference.crop_id,
        Order.created_at >= three_months_ago,
        Order.status.in_([OrderStatus.PAID, OrderStatus.ALLOCATED, OrderStatus.DISPATCHED, OrderStatus.DELIVERED])
    ).all()
    
    if orders:
        total_quantity = sum(
            item.qty_kg for order in orders
            for item in order.order_items
            if item.listing and item.listing.lot and item.listing.lot.production_plan.crop_id == preference.crop_id
        )
        
        # Average per month (3 months)
        preference.average_monthly_consumption_kg = total_quantity / 3
        
        # Get last order
        last_order = max(orders, key=lambda o: o.created_at)
        preference.last_order_date = last_order.created_at
        
        last_order_quantity = sum(
            item.qty_kg for item in last_order.order_items
            if item.listing and item.listing.lot and item.listing.lot.production_plan.crop_id == preference.crop_id
        )
        preference.last_order_quantity_kg = last_order_quantity
    
    db.commit()


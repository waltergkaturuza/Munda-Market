"""
Service for generating inventory alerts based on buyer preferences and stock levels
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
import json

from ..models.buyer_inventory import (
    BuyerInventoryPreference,
    InventoryAlert,
    AlertSeverity,
    AlertStatus
)
from ..models.crop import Crop
from ..models.production import Lot, ProductionPlan
from ..models.pricing import Listing
from ..models.stock_history import StockHistory
from ..models.user import User
from .notifications import notification_service


def generate_inventory_alerts(db: Session, buyer_user_id: int = None):
    """
    Generate inventory alerts for buyers based on their preferences and current stock levels.
    
    Args:
        db: Database session
        buyer_user_id: Optional specific buyer ID. If None, processes all buyers.
    
    Returns:
        dict: Summary of alerts generated
    """
    alerts_created = 0
    alerts_updated = 0
    
    # Get all active preferences
    query = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.enable_low_stock_alerts == True
    )
    
    if buyer_user_id:
        query = query.filter(BuyerInventoryPreference.buyer_user_id == buyer_user_id)
    
    preferences = query.all()
    
    for preference in preferences:
        crop = preference.crop
        if not crop:
            continue
        
        # Get current stock levels for this crop
        stock_query = db.query(
            func.sum(Lot.available_kg).label('total_available'),
            func.sum(Lot.reserved_kg).label('total_reserved'),
            func.sum(Lot.sold_kg).label('total_sold')
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
        remaining_kg = total_available - total_reserved - total_sold
        
        # Check for low stock alert
        if preference.enable_low_stock_alerts and preference.min_stock_threshold_kg:
            if remaining_kg < preference.min_stock_threshold_kg:
                # Determine severity
                if remaining_kg <= 0:
                    severity = AlertSeverity.CRITICAL
                elif remaining_kg < preference.min_stock_threshold_kg * 0.5:
                    severity = AlertSeverity.HIGH
                elif remaining_kg < preference.min_stock_threshold_kg * 0.75:
                    severity = AlertSeverity.MEDIUM
                else:
                    severity = AlertSeverity.LOW
                
                # Check if alert already exists
                existing_alert = db.query(InventoryAlert).filter(
                    InventoryAlert.buyer_user_id == preference.buyer_user_id,
                    InventoryAlert.crop_id == crop.crop_id,
                    InventoryAlert.alert_type == "low_stock",
                    InventoryAlert.status == AlertStatus.ACTIVE
                ).first()
                
                alert_data = {
                    "current_stock_kg": remaining_kg,
                    "threshold_kg": preference.min_stock_threshold_kg,
                    "total_available_kg": total_available,
                    "reserved_kg": total_reserved,
                    "sold_kg": total_sold,
                }
                
                # Get notification channels preference
                notification_channels = {}
                if preference.notification_channels:
                    try:
                        notification_channels = json.loads(preference.notification_channels)
                    except:
                        notification_channels = {"in_app": True}
                
                if existing_alert:
                    # Update existing alert
                    existing_alert.severity = severity
                    existing_alert.message = f"Stock for {crop.name} is below your threshold of {preference.min_stock_threshold_kg}kg. Current stock: {remaining_kg:.1f}kg."
                    existing_alert.alert_data = json.dumps(alert_data)
                    existing_alert.updated_at = datetime.utcnow()
                    alerts_updated += 1
                else:
                    # Create new alert
                    alert = InventoryAlert(
                        buyer_user_id=preference.buyer_user_id,
                        crop_id=crop.crop_id,
                        alert_type="low_stock",
                        severity=severity,
                        status=AlertStatus.ACTIVE,
                        title=f"Low Stock Alert: {crop.name}",
                        message=f"Stock for {crop.name} is below your threshold of {preference.min_stock_threshold_kg}kg. Current stock: {remaining_kg:.1f}kg.",
                        alert_data=json.dumps(alert_data),
                        action_url=f"/crops?crop={crop.crop_id}",
                        action_text="View Listings",
                        expires_at=datetime.utcnow() + timedelta(days=7)  # Auto-expire after 7 days
                    )
                    db.add(alert)
                    alerts_created += 1
                    
                    # Send notifications if enabled
                    user = db.query(User).filter(User.user_id == preference.buyer_user_id).first()
                    if user and (notification_channels.get("email") or notification_channels.get("sms")):
                        notification_service.send_inventory_alert(
                            user=user,
                            alert_title=alert.title,
                            alert_message=alert.message,
                            alert_data=alert_data,
                            notification_channels=notification_channels
                        )
        
        # Check for harvest window alerts
        if preference.enable_harvest_alerts:
            # Find upcoming harvests
            now = datetime.utcnow()
            harvest_start = now + timedelta(days=preference.days_before_harvest_alert)
            harvest_end = now + timedelta(days=preference.days_after_harvest_alert)
            
            upcoming_harvests = db.query(ProductionPlan).filter(
                ProductionPlan.crop_id == crop.crop_id,
                ProductionPlan.status.in_(["growing", "harvest_ready", "harvesting"]),
                ProductionPlan.expected_harvest_window_start != None,
                ProductionPlan.expected_harvest_window_start >= now,
                ProductionPlan.expected_harvest_window_start <= harvest_end
            ).all()
            
            for harvest in upcoming_harvests:
                days_until = (harvest.expected_harvest_window_start - now).days
                
                # Check if alert already exists for this harvest
                existing_alert = db.query(InventoryAlert).filter(
                    InventoryAlert.buyer_user_id == preference.buyer_user_id,
                    InventoryAlert.crop_id == crop.crop_id,
                    InventoryAlert.alert_type == "harvest_window",
                    InventoryAlert.status == AlertStatus.ACTIVE,
                    InventoryAlert.lot_id == None  # General harvest alert
                ).first()
                
                if not existing_alert and days_until <= preference.days_before_harvest_alert:
                    alert_data = {
                        "harvest_date": harvest.expected_harvest_window_start.isoformat(),
                        "days_until_harvest": days_until,
                        "expected_yield_kg": harvest.expected_yield_kg,
                    }
                    
                    alert = InventoryAlert(
                        buyer_user_id=preference.buyer_user_id,
                        crop_id=crop.crop_id,
                        alert_type="harvest_window",
                        severity=AlertSeverity.MEDIUM if days_until <= 3 else AlertSeverity.LOW,
                        status=AlertStatus.ACTIVE,
                        title=f"Upcoming Harvest: {crop.name}",
                        message=f"{crop.name} harvest window starts in {days_until} days. Expected yield: {harvest.expected_yield_kg or 'N/A'}kg.",
                        alert_data=json.dumps(alert_data),
                        action_url=f"/crops?crop={crop.crop_id}",
                        action_text="View Listings",
                        expires_at=harvest.expected_harvest_window_start + timedelta(days=7)
                    )
                    db.add(alert)
                    alerts_created += 1
    
    db.commit()
    
    return {
        "alerts_created": alerts_created,
        "alerts_updated": alerts_updated,
        "total_processed": len(preferences)
    }


def record_stock_history(db: Session, crop_id: int = None):
    """
    Record current stock levels as historical snapshot
    
    Args:
        db: Database session
        crop_id: Optional specific crop ID. If None, records for all crops.
    """
    from ..models.crop import Crop
    
    query = db.query(Crop).filter(Crop.is_active == True)
    if crop_id:
        query = query.filter(Crop.crop_id == crop_id)
    
    crops = query.all()
    
    for crop in crops:
        # Get current stock levels
        stock_query = db.query(
            func.sum(Lot.available_kg).label('total_available'),
            func.sum(Lot.reserved_kg).label('total_reserved'),
            func.sum(Lot.sold_kg).label('total_sold'),
            func.count(Listing.listing_id).label('listings_count'),
            func.avg(Listing.sell_price_per_kg).label('avg_price'),
            func.min(Listing.sell_price_per_kg).label('min_price'),
            func.max(Listing.sell_price_per_kg).label('max_price')
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
        
        if stock_data and stock_data.total_available:
            total_available = stock_data.total_available or 0.0
            total_reserved = stock_data.total_reserved or 0.0
            total_sold = stock_data.total_sold or 0.0
            remaining_kg = total_available - total_reserved - total_sold
            
            # Create history record
            history = StockHistory(
                crop_id=crop.crop_id,
                total_available_kg=total_available,
                total_reserved_kg=total_reserved,
                total_sold_kg=total_sold,
                remaining_kg=remaining_kg,
                avg_price_per_kg=stock_data.avg_price,
                min_price_per_kg=stock_data.min_price,
                max_price_per_kg=stock_data.max_price,
                active_listings_count=stock_data.listings_count or 0
            )
            db.add(history)
    
    db.commit()


def check_price_alerts(db: Session, buyer_user_id: int = None):
    """
    Check for price changes and generate alerts
    
    Args:
        db: Database session
        buyer_user_id: Optional specific buyer ID
    """
    alerts_created = 0
    
    # Get preferences with price alerts enabled
    query = db.query(BuyerInventoryPreference).filter(
        BuyerInventoryPreference.enable_price_alerts == True
    )
    
    if buyer_user_id:
        query = query.filter(BuyerInventoryPreference.buyer_user_id == buyer_user_id)
    
    preferences = query.all()
    
    for preference in preferences:
        crop = preference.crop
        if not crop:
            continue
        
        # Get current average price
        price_query = db.query(
            func.avg(Listing.sell_price_per_kg).label('avg_price')
        ).join(
            Lot, Lot.lot_id == Listing.lot_id
        ).join(
            ProductionPlan, ProductionPlan.plan_id == Lot.plan_id
        ).filter(
            ProductionPlan.crop_id == crop.crop_id,
            Listing.is_active == True
        )
        
        current_price = price_query.scalar()
        
        if current_price:
            # Get last recorded price from history (last 24 hours)
            yesterday = datetime.utcnow() - timedelta(days=1)
            last_history = db.query(StockHistory).filter(
                StockHistory.crop_id == crop.crop_id,
                StockHistory.recorded_at >= yesterday
            ).order_by(StockHistory.recorded_at.desc()).first()
            
            if last_history and last_history.avg_price_per_kg:
                price_change_pct = ((current_price - last_history.avg_price_per_kg) / last_history.avg_price_per_kg) * 100
                
                # Alert if price changed by more than 10%
                if abs(price_change_pct) >= 10:
                    # Check if alert already exists
                    existing_alert = db.query(InventoryAlert).filter(
                        InventoryAlert.buyer_user_id == preference.buyer_user_id,
                        InventoryAlert.crop_id == crop.crop_id,
                        InventoryAlert.alert_type == "price_change",
                        InventoryAlert.status == AlertStatus.ACTIVE
                    ).first()
                    
                    if not existing_alert:
                        direction = "increased" if price_change_pct > 0 else "decreased"
                        alert_data = {
                            "current_price": current_price,
                            "previous_price": last_history.avg_price_per_kg,
                            "price_change_pct": abs(price_change_pct),
                            "direction": direction
                        }
                        
                        alert = InventoryAlert(
                            buyer_user_id=preference.buyer_user_id,
                            crop_id=crop.crop_id,
                            alert_type="price_change",
                            severity=AlertSeverity.MEDIUM,
                            status=AlertStatus.ACTIVE,
                            title=f"Price Change Alert: {crop.name}",
                            message=f"Price for {crop.name} has {direction} by {abs(price_change_pct):.1f}%. Current: ${current_price:.2f}/kg, Previous: ${last_history.avg_price_per_kg:.2f}/kg.",
                            alert_data=json.dumps(alert_data),
                            action_url=f"/crops?crop={crop.crop_id}",
                            action_text="View Listings",
                            expires_at=datetime.utcnow() + timedelta(days=3)
                        )
                        db.add(alert)
                        alerts_created += 1
                        
                        # Send notifications
                        notification_channels = {}
                        if preference.notification_channels:
                            try:
                                notification_channels = json.loads(preference.notification_channels)
                            except:
                                notification_channels = {"in_app": True}
                        
                        user = db.query(User).filter(User.user_id == preference.buyer_user_id).first()
                        if user and (notification_channels.get("email") or notification_channels.get("sms")):
                            notification_service.send_inventory_alert(
                                user=user,
                                alert_title=alert.title,
                                alert_message=alert.message,
                                alert_data=alert_data,
                                notification_channels=notification_channels
                            )
    
    db.commit()
    return alerts_created


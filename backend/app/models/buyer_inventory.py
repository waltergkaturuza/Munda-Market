from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class AlertSeverity(str, Enum):
    """Alert severity levels"""
    LOW = "low"           # Informational
    MEDIUM = "medium"     # Attention needed
    HIGH = "high"         # Urgent action required
    CRITICAL = "critical" # Critical stockout risk


class AlertStatus(str, Enum):
    """Alert status"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class BuyerInventoryPreference(Base):
    """Buyer-specific inventory monitoring preferences"""
    __tablename__ = "buyer_inventory_preferences"
    
    # Primary key
    preference_id = Column(Integer, primary_key=True, index=True)
    
    # Buyer relationship
    buyer_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    
    # Product/crop preference
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False, index=True)
    
    # Reorder thresholds
    min_stock_threshold_kg = Column(Float, nullable=False, default=0.0)  # Alert when stock below this
    reorder_quantity_kg = Column(Float, nullable=True)  # Suggested reorder quantity
    max_stock_threshold_kg = Column(Float, nullable=True)  # Optional: alert if stock too high
    
    # Harvest window preferences
    days_before_harvest_alert = Column(Integer, default=7)  # Alert X days before harvest window
    days_after_harvest_alert = Column(Integer, default=3)  # Alert X days after harvest window starts
    
    # Purchase history tracking
    average_monthly_consumption_kg = Column(Float, nullable=True)  # Calculated from order history
    last_order_date = Column(DateTime(timezone=True), nullable=True)
    last_order_quantity_kg = Column(Float, nullable=True)
    
    # Alert preferences
    enable_low_stock_alerts = Column(Boolean, default=True)
    enable_harvest_alerts = Column(Boolean, default=True)
    enable_price_alerts = Column(Boolean, default=False)  # Future: price change alerts
    alert_frequency = Column(String(20), default="daily")  # daily, weekly, realtime
    
    # Notification channels (JSON)
    # Example: {"email": true, "sms": false, "in_app": true}
    notification_channels = Column(Text, nullable=True)
    
    # Favorite/priority flag
    is_favorite = Column(Boolean, default=False)
    priority = Column(Integer, default=0)  # Higher priority = more important
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_user_id])
    crop = relationship("Crop")
    
    def __repr__(self):
        return f"<BuyerInventoryPreference(buyer={self.buyer_user_id}, crop={self.crop_id}, min_stock={self.min_stock_threshold_kg}kg)>"


class InventoryAlert(Base):
    """Generated inventory alerts for buyers"""
    __tablename__ = "inventory_alerts"
    
    # Primary key
    alert_id = Column(Integer, primary_key=True, index=True)
    
    # Buyer relationship
    buyer_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    
    # Related entities
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.listing_id"), nullable=True, index=True)
    lot_id = Column(Integer, ForeignKey("lots.lot_id"), nullable=True, index=True)
    
    # Alert details
    alert_type = Column(String(50), nullable=False, index=True)  # low_stock, harvest_window, price_change, etc.
    severity = Column(SQLEnum(AlertSeverity), nullable=False, default=AlertSeverity.MEDIUM)
    status = Column(SQLEnum(AlertStatus), nullable=False, default=AlertStatus.ACTIVE)
    
    # Alert content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Alert data (JSON)
    # Example: {"current_stock_kg": 50, "threshold_kg": 100, "harvest_date": "2024-11-15"}
    alert_data = Column(Text, nullable=True)
    
    # Action links
    action_url = Column(String(500), nullable=True)  # Link to relevant page (e.g., listing, crop page)
    action_text = Column(String(100), nullable=True)  # "View Listing", "Order Now", etc.
    
    # Acknowledgment
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    # Resolution
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Auto-expire old alerts
    
    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_user_id])
    crop = relationship("Crop")
    listing = relationship("Listing")
    lot = relationship("Lot")
    
    def __repr__(self):
        return f"<InventoryAlert(id={self.alert_id}, buyer={self.buyer_user_id}, type={self.alert_type}, severity={self.severity})>"


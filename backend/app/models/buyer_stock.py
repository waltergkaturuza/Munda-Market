from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class StockMovementType(str, Enum):
    """Types of stock movements"""
    PURCHASE = "purchase"           # Stock received from order
    CONSUMPTION = "consumption"    # Stock used/sold
    WASTE = "waste"                # Stock expired/damaged
    ADJUSTMENT = "adjustment"       # Manual adjustment
    RETURN = "return"              # Returned to supplier


class SalesIntensityCode(str, Enum):
    """Sales intensity classification"""
    A = "A"  # Fast moving - sold out in < 3 days
    B = "B"  # Normal moving - sold out in 4-7 days
    C = "C"  # Slow moving - sold out in > 7 days
    D = "D"  # Obsolete - unsold/expired


class BuyerStock(Base):
    """Current stock levels for buyers"""
    __tablename__ = "buyer_stock"
    
    # Primary key
    stock_id = Column(Integer, primary_key=True, index=True)
    
    # Buyer relationship
    buyer_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    
    # Product/crop
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False, index=True)
    
    # Current stock levels
    current_quantity_kg = Column(Float, nullable=False, default=0.0)
    reserved_quantity_kg = Column(Float, nullable=False, default=0.0)  # Reserved for orders
    
    # Stock metadata
    purchase_date = Column(DateTime(timezone=True), nullable=True)  # When stock was received
    expiry_date = Column(DateTime(timezone=True), nullable=True)  # Calculated from shelf_life_days
    shelf_life_days = Column(Integer, nullable=True)  # Days until expiry (e.g., 5 for tomatoes)
    
    # Location/storage (JSON)
    # Example: {"warehouse": "Main", "section": "Cold Storage", "bin": "A-12"}
    storage_location = Column(Text, nullable=True)
    
    # Batch/lot tracking
    batch_number = Column(String(50), nullable=True, index=True)
    supplier_order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=True)
    
    # Cost tracking
    unit_cost_usd = Column(Float, nullable=True)  # Cost per kg when purchased
    total_value_usd = Column(Float, nullable=True)  # current_quantity_kg * unit_cost_usd
    
    # Reorder calculations
    reorder_point_kg = Column(Float, nullable=True)  # Calculated ROP
    safety_stock_kg = Column(Float, nullable=True)  # Safety stock level
    lead_time_days = Column(Integer, nullable=True, default=3)  # Days from order to delivery
    average_daily_usage_kg = Column(Float, nullable=True)  # Calculated from consumption history
    
    # Minimum stock cover
    minimum_stock_cover_days = Column(Integer, nullable=True, default=7)  # Days of stock buyer wants to maintain
    
    # Sales intensity
    sales_intensity_code = Column(SQLEnum(SalesIntensityCode), nullable=True)
    inventory_turnover = Column(Float, nullable=True)  # Calculated turnover ratio
    days_of_inventory = Column(Float, nullable=True)  # 365 / inventory_turnover
    
    # Status
    is_active = Column(Boolean, default=True)
    is_expired = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_movement_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    buyer = relationship("User", foreign_keys=[buyer_user_id])
    crop = relationship("Crop")
    supplier_order = relationship("Order", foreign_keys=[supplier_order_id])
    
    def __repr__(self):
        return f"<BuyerStock(buyer={self.buyer_user_id}, crop={self.crop_id}, qty={self.current_quantity_kg}kg)>"


class StockMovement(Base):
    """Historical stock movements (purchases, consumption, waste)"""
    __tablename__ = "stock_movements"
    
    # Primary key
    movement_id = Column(Integer, primary_key=True, index=True)
    
    # Stock relationship
    stock_id = Column(Integer, ForeignKey("buyer_stock.stock_id"), nullable=False, index=True)
    
    # Buyer and crop (denormalized for easier queries)
    buyer_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False, index=True)
    
    # Movement details
    movement_type = Column(SQLEnum(StockMovementType), nullable=False, index=True)
    quantity_kg = Column(Float, nullable=False)  # Positive for purchase, negative for consumption/waste
    
    # Reference to source
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=True)  # For purchases
    order_item_id = Column(Integer, ForeignKey("order_items.order_item_id"), nullable=True)
    
    # Cost information
    unit_cost_usd = Column(Float, nullable=True)
    total_cost_usd = Column(Float, nullable=True)
    
    # Notes and metadata
    notes = Column(Text, nullable=True)
    movement_metadata = Column(Text, nullable=True)  # JSON for additional data
    
    # Timestamps
    movement_date = Column(DateTime(timezone=True), nullable=False, index=True, server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    stock = relationship("BuyerStock", foreign_keys=[stock_id])
    buyer = relationship("User", foreign_keys=[buyer_user_id])
    crop = relationship("Crop")
    order = relationship("Order", foreign_keys=[order_id])
    
    def __repr__(self):
        return f"<StockMovement(id={self.movement_id}, type={self.movement_type}, qty={self.quantity_kg}kg)>"


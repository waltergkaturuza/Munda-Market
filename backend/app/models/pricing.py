from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class MarkupType(str, Enum):
    FIXED_PERCENT = "fixed_percent"
    FIXED_AMOUNT = "fixed_amount"
    TIERED_PERCENT = "tiered_percent"
    TIERED_AMOUNT = "tiered_amount"
    DYNAMIC = "dynamic"


class ListingChannel(str, Enum):
    WEB = "web"
    MOBILE = "mobile"
    WHATSAPP = "whatsapp"
    API = "api"


class PriceRule(Base):
    __tablename__ = "price_rules"
    
    # Primary key
    rule_id = Column(Integer, primary_key=True, index=True)
    
    # Rule identification
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Scope definition (JSON)
    # Example structures:
    # {"crop_ids": [1, 2], "districts": ["Harare", "Bulawayo"], "grades": ["A", "B"]}
    # {"buyer_tiers": ["premium"], "order_value_min": 1000}
    # {"all": true} for global rules
    scope_json = Column(Text, nullable=False)
    
    # Markup configuration
    markup_type = Column(SQLEnum(MarkupType), nullable=False)
    
    # Markup values (interpretation depends on markup_type)
    markup_value = Column(Float, nullable=False)  # Primary markup value
    markup_min = Column(Float, nullable=True)     # Minimum markup (for floors)
    markup_max = Column(Float, nullable=True)     # Maximum markup (for caps)
    
    # Tiered markup configuration (JSON for complex rules)
    # Example: [{"min": 0, "max": 200, "rate": 0.15}, {"min": 200, "max": 1000, "rate": 0.12}]
    tiered_config = Column(Text, nullable=True)
    
    # Geographic surcharges
    distance_surcharge_per_km = Column(Float, default=0.0)
    distance_threshold_km = Column(Integer, default=200)  # Distance before surcharge kicks in
    
    # Special surcharges
    cold_chain_surcharge = Column(Float, default=0.0)
    quality_premium_multiplier = Column(Float, default=1.0)
    
    # Rule priority and conflicts
    priority = Column(Integer, default=100)  # Lower number = higher priority
    
    # Validity period
    effective_from = Column(DateTime(timezone=True), nullable=False)
    effective_to = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    active = Column(Boolean, default=True)
    
    # Audit information
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<PriceRule(id={self.rule_id}, name='{self.name}', type='{self.markup_type}')>"


class Listing(Base):
    __tablename__ = "listings"
    
    # Primary key
    listing_id = Column(Integer, primary_key=True, index=True)
    
    # Source lot
    lot_id = Column(Integer, ForeignKey("lots.lot_id"), nullable=False, index=True)
    
    # Pricing (buyer-facing)
    sell_price_per_kg = Column(Float, nullable=False)  # Price shown to buyers (includes markup)
    base_price_per_kg = Column(Float, nullable=False)  # Farm-gate price
    markup_amount_per_kg = Column(Float, nullable=False)  # Calculated markup
    
    # Applied pricing rules (for audit)
    applied_price_rules = Column(Text, nullable=True)  # JSON array of rule IDs that were applied
    
    # Currency
    currency = Column(String(3), default="USD")
    
    # Listing visibility
    visible_from = Column(DateTime(timezone=True), nullable=False)
    visible_to = Column(DateTime(timezone=True), nullable=True)
    
    # Channel availability
    channel = Column(SQLEnum(ListingChannel), default=ListingChannel.WEB)
    
    # Buyer restrictions (JSON)
    # Example: {"buyer_tiers": ["premium"], "min_order_history": 5}
    buyer_restrictions = Column(Text, nullable=True)
    
    # Geographic restrictions
    delivery_zones = Column(Text, nullable=True)  # JSON array of delivery areas
    
    # Negotiation settings
    negotiation_allowed = Column(Boolean, default=True)
    min_negotiable_price = Column(Float, nullable=True)
    max_discount_percent = Column(Float, default=5.0)  # Maximum % discount allowed
    
    # Delivery and logistics
    delivery_fee_per_kg = Column(Float, default=0.0)
    service_fee_per_order = Column(Float, default=0.0)
    estimated_delivery_days = Column(Integer, default=2)
    
    # Availability
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    lot = relationship("Lot", back_populates="listings")
    order_items = relationship("OrderItem", back_populates="listing")
    
    @property
    def total_price_per_kg(self):
        """Total price including delivery and service fees"""
        return self.sell_price_per_kg + self.delivery_fee_per_kg
    
    @property
    def markup_percentage(self):
        """Calculate markup as percentage of base price"""
        if self.base_price_per_kg > 0:
            return (self.markup_amount_per_kg / self.base_price_per_kg) * 100
        return 0
    
    def __repr__(self):
        return f"<Listing(id={self.listing_id}, price=${self.sell_price_per_kg}/kg, lot={self.lot_id})>"

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Enum as SQLEnum, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class ProductionStatus(str, Enum):
    PLANNED = "planned"
    PLANTED = "planted"
    GROWING = "growing"
    FLOWERING = "flowering"
    FRUIT_SET = "fruit_set"
    HARVEST_READY = "harvest_ready"
    HARVESTING = "harvesting"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class LotStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    HARVESTED = "harvested"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    EXPIRED = "expired"


class IrrigationType(str, Enum):
    RAINFED = "rainfed"
    DRIP = "drip"
    SPRINKLER = "sprinkler"
    FLOOD = "flood"
    MANUAL = "manual"


class ProductionPlan(Base):
    __tablename__ = "production_plans"
    
    # Primary key
    plan_id = Column(Integer, primary_key=True, index=True)
    
    # Relationships
    farm_id = Column(Integer, ForeignKey("farms.farm_id"), nullable=False, index=True)
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False, index=True)
    
    # Crop details
    variety = Column(String(100), nullable=True)
    
    # Land allocation
    hectares = Column(Float, nullable=False)
    field_identifier = Column(String(50), nullable=True)  # Field name or block number
    
    # Planting information
    seed_date = Column(DateTime(timezone=True), nullable=True)
    expected_planting_date = Column(DateTime(timezone=True), nullable=True)
    actual_planting_date = Column(DateTime(timezone=True), nullable=True)
    
    # Harvest timing
    harvest_start = Column(DateTime(timezone=True), nullable=True)
    harvest_end = Column(DateTime(timezone=True), nullable=True)
    expected_harvest_window_start = Column(DateTime(timezone=True), nullable=True)
    expected_harvest_window_end = Column(DateTime(timezone=True), nullable=True)
    
    # Yield projections
    expected_yield_kg = Column(Float, nullable=True)
    actual_yield_kg = Column(Float, nullable=True)
    yield_per_hectare = Column(Float, nullable=True)  # Calculated field
    
    # Pricing
    target_price_per_kg = Column(Float, nullable=False)  # Farmer's target farm-gate price
    
    # Production methods
    irrigation = Column(SQLEnum(IrrigationType), nullable=False, default=IrrigationType.RAINFED)
    input_supplier = Column(String(100), nullable=True)
    seed_variety_details = Column(Text, nullable=True)  # JSON for detailed seed info
    
    # Status and tracking
    status = Column(SQLEnum(ProductionStatus), default=ProductionStatus.PLANNED)
    
    # Progress updates (JSON)
    # Example: [{"date": "2024-01-15", "stage": "planted", "notes": "Good germination"}]
    progress_updates = Column(Text, nullable=True)
    
    # Quality and certification
    organic_certified = Column(Boolean, default=False)
    certification_documents = Column(Text, nullable=True)  # JSON array of document URLs
    
    # Risk factors
    weather_risk_level = Column(String(20), nullable=True)  # low, medium, high
    pest_disease_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    farm = relationship("Farm", back_populates="production_plans")
    crop = relationship("Crop", back_populates="production_plans")
    lots = relationship("Lot", back_populates="production_plan")
    
    def __repr__(self):
        return f"<ProductionPlan(id={self.plan_id}, crop='{self.crop.name if self.crop else 'N/A'}', hectares={self.hectares})>"


class Lot(Base):
    __tablename__ = "lots"
    
    # Primary key
    lot_id = Column(Integer, primary_key=True, index=True)
    
    # Parent production plan
    plan_id = Column(Integer, ForeignKey("production_plans.plan_id"), nullable=False, index=True)
    
    # Lot identification
    lot_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # Quality grading
    grade = Column(String(10), nullable=False, index=True)  # A, B, C based on grade schema
    
    # Quantity available
    available_kg = Column(Float, nullable=False)
    reserved_kg = Column(Float, default=0.0)
    sold_kg = Column(Float, default=0.0)
    
    # Order constraints
    min_order_kg = Column(Float, nullable=False, default=1.0)
    max_order_kg = Column(Float, nullable=True)
    
    # Quality details
    size_range = Column(String(50), nullable=True)  # e.g., "5-7cm"
    color_description = Column(String(100), nullable=True)
    brix_reading = Column(Float, nullable=True)  # For fruits
    moisture_content = Column(Float, nullable=True)  # For grains
    
    # Harvest details
    harvest_date = Column(DateTime(timezone=True), nullable=True)
    best_before_date = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    current_status = Column(SQLEnum(LotStatus), default=LotStatus.AVAILABLE)
    
    # Photos and documentation
    photos = Column(Text, nullable=True)  # JSON array of photo URLs
    thumbnail_url = Column(String(500), nullable=True)  # Primary thumbnail for quick display
    quality_certificates = Column(Text, nullable=True)  # JSON array of certificate URLs
    
    # Marketing and description
    description = Column(Text, nullable=True)  # Detailed description of this specific lot
    highlights = Column(Text, nullable=True)  # JSON array of key selling points
    
    # Pesticide and treatment information
    pesticide_phi_days = Column(Integer, nullable=True)  # Pre-harvest interval
    last_treatment_date = Column(DateTime(timezone=True), nullable=True)
    treatment_details = Column(Text, nullable=True)  # JSON of treatments applied
    
    # Storage and handling
    storage_location = Column(String(100), nullable=True)
    storage_conditions = Column(Text, nullable=True)  # JSON of storage requirements
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    production_plan = relationship("ProductionPlan", back_populates="lots")
    listings = relationship("Listing", back_populates="lot")
    # order_items = relationship("OrderItem", back_populates="lot")  # Remove for now
    qc_checks = relationship("QCCheck", back_populates="lot")
    
    @property
    def remaining_kg(self):
        """Calculate remaining available quantity"""
        return self.available_kg - self.reserved_kg - self.sold_kg
    
    def __repr__(self):
        return f"<Lot(id={self.lot_id}, lot_number='{self.lot_number}', grade='{self.grade}', available={self.available_kg}kg)>"

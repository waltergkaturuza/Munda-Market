from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Crop(Base):
    __tablename__ = "crops"
    
    # Primary key
    crop_id = Column(Integer, primary_key=True, index=True)
    
    # Crop identification
    name = Column(String(100), nullable=False, index=True)  # e.g., "tomato", "onion"
    variety = Column(String(100), nullable=True)  # e.g., "roma", "cherry"
    scientific_name = Column(String(150), nullable=True)
    
    # Classification
    category = Column(String(50), nullable=True, index=True)  # e.g., "vegetable", "fruit", "grain"
    subcategory = Column(String(50), nullable=True)  # e.g., "leafy green", "root vegetable"
    
    # Units and measurements
    unit = Column(String(20), nullable=False, default="kg")  # kg, tonnes, bags, etc.
    
    # Grade schema reference
    grade_schema_id = Column(Integer, ForeignKey("grade_schemas.grade_schema_id"), nullable=True)
    
    # Crop characteristics
    perishability_days = Column(Integer, nullable=True)  # Days before spoilage
    cold_chain_required = Column(Boolean, default=False)
    temperature_min = Column(Float, nullable=True)  # Celsius
    temperature_max = Column(Float, nullable=True)  # Celsius
    humidity_requirements = Column(String(50), nullable=True)  # e.g., "60-80%"
    
    # Growing information
    typical_growing_days = Column(Integer, nullable=True)  # Days from seed to harvest
    seasons = Column(Text, nullable=True)  # JSON array of suitable seasons
    
    # Quality parameters
    quality_parameters = Column(Text, nullable=True)  # JSON of parameters to check (size, color, brix, etc.)
    
    # Pricing
    base_price_usd_per_kg = Column(Float, nullable=True)  # Reference price for calculations
    
    # Media and marketing
    image_url = Column(String(500), nullable=True)  # Primary product image
    gallery_images = Column(Text, nullable=True)  # JSON array of additional images
    description = Column(Text, nullable=True)  # Detailed marketing description
    short_description = Column(String(500), nullable=True)  # Brief description for listings
    
    # Nutritional and benefits information
    nutritional_info = Column(Text, nullable=True)  # JSON of nutritional data
    health_benefits = Column(Text, nullable=True)  # Marketing text about health benefits
    
    # Storage and handling tips (for buyer education)
    storage_tips = Column(Text, nullable=True)
    preparation_tips = Column(Text, nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    grade_schema = relationship("GradeSchema", back_populates="crops")
    production_plans = relationship("ProductionPlan", back_populates="crop")
    
    def __repr__(self):
        return f"<Crop(id={self.crop_id}, name='{self.name}', variety='{self.variety}')>"


class GradeSchema(Base):
    __tablename__ = "grade_schemas"
    
    # Primary key
    grade_schema_id = Column(Integer, primary_key=True, index=True)
    
    # Schema details
    name = Column(String(100), nullable=False)  # e.g., "Standard Vegetable Grading"
    description = Column(Text, nullable=True)
    
    # Grade definitions (JSON)
    # Example structure:
    # {
    #   "A": {"description": "Premium quality", "size_min": 5, "size_max": 8, "blemishes": "none"},
    #   "B": {"description": "Good quality", "size_min": 4, "size_max": 9, "blemishes": "minor"},
    #   "C": {"description": "Standard quality", "size_min": 3, "size_max": 10, "blemishes": "acceptable"}
    # }
    rules_json = Column(Text, nullable=False)
    
    # Schema metadata
    version = Column(String(20), default="1.0")
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    crops = relationship("Crop", back_populates="grade_schema")
    
    def __repr__(self):
        return f"<GradeSchema(id={self.grade_schema_id}, name='{self.name}')>"

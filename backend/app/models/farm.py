from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
# from geoalchemy2 import Geography  # TODO: Add back when PostGIS is set up
from ..core.database import Base


class Farm(Base):
    __tablename__ = "farms"
    
    # Primary key
    farm_id = Column(Integer, primary_key=True, index=True)
    
    # Owner relationship
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    
    # Farm details
    name = Column(String(100), nullable=False)
    
    # Location data
    geohash = Column(String(20), nullable=False, index=True)  # Geohash for efficient location queries
    # location = Column(Geography('POINT', srid=4326), nullable=True)  # PostGIS point for precise location
    latitude = Column(Float, nullable=True)  # Simple lat/lon until PostGIS is set up
    longitude = Column(Float, nullable=True)
    
    # Administrative location
    ward = Column(String(50), nullable=True)
    district = Column(String(50), nullable=False, index=True)
    province = Column(String(50), nullable=False, index=True)
    
    # Address details
    address_line1 = Column(String(200), nullable=True)
    address_line2 = Column(String(200), nullable=True) 
    postal_code = Column(String(20), nullable=True)
    
    # Farm characteristics
    total_hectares = Column(Float, nullable=True)
    farm_type = Column(String(50), nullable=True)  # e.g., "commercial", "smallholder", "cooperative"
    irrigation_available = Column(String(50), nullable=True)  # e.g., "drip", "sprinkler", "flood", "rainfed"
    
    # Verification and documents
    verification_status = Column(String(20), default="pending")  # pending, verified, rejected
    verification_documents = Column(Text, nullable=True)  # JSON string for document references
    verification_photos = Column(Text, nullable=True)  # JSON array of photo URLs
    
    # Association/cooperative info
    association_name = Column(String(100), nullable=True)
    association_membership_id = Column(String(50), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="farms")
    production_plans = relationship("ProductionPlan", back_populates="farm")
    
    def __repr__(self):
        return f"<Farm(id={self.farm_id}, name='{self.name}', district='{self.district}')>"

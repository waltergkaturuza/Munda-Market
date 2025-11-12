"""
Model for tracking historical stock levels
"""
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class StockHistory(Base):
    """Historical snapshot of stock levels for crops"""
    __tablename__ = "stock_history"
    
    # Primary key
    history_id = Column(Integer, primary_key=True, index=True)
    
    # Crop reference
    crop_id = Column(Integer, ForeignKey("crops.crop_id"), nullable=False, index=True)
    
    # Stock metrics at snapshot time
    total_available_kg = Column(Float, nullable=False)
    total_reserved_kg = Column(Float, default=0.0)
    total_sold_kg = Column(Float, default=0.0)
    remaining_kg = Column(Float, nullable=False)
    
    # Price metrics (average from active listings)
    avg_price_per_kg = Column(Float, nullable=True)
    min_price_per_kg = Column(Float, nullable=True)
    max_price_per_kg = Column(Float, nullable=True)
    
    # Active listings count
    active_listings_count = Column(Integer, default=0)
    
    # Timestamp
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationships
    crop = relationship("Crop")
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_crop_recorded', 'crop_id', 'recorded_at'),
    )
    
    def __repr__(self):
        return f"<StockHistory(crop_id={self.crop_id}, remaining={self.remaining_kg}kg, recorded={self.recorded_at})>"


from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from enum import Enum
from ..core.database import Base


class BannerType(str, Enum):
    """Banner display type"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    PROMOTION = "promotion"


class BannerPlatform(str, Enum):
    """Platform where banner should be displayed"""
    ADMIN = "admin"
    BUYER = "buyer"
    FARMER = "farmer"
    ALL = "all"  # Display on all platforms


class Banner(Base):
    __tablename__ = "banners"
    
    # Primary key
    banner_id = Column(Integer, primary_key=True, index=True)
    
    # Banner content
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    banner_type = Column(SQLEnum(BannerType), nullable=False, default=BannerType.INFO)
    
    # Platform targeting
    platform = Column(SQLEnum(BannerPlatform), nullable=False, default=BannerPlatform.ALL)
    
    # Visual customization
    image_url = Column(String(500), nullable=True)  # Optional banner image
    link_url = Column(String(500), nullable=True)  # Optional link when clicked
    link_text = Column(String(100), nullable=True)  # Text for the link button
    
    # Scheduling
    start_date = Column(DateTime(timezone=True), nullable=True)  # When to start showing
    end_date = Column(DateTime(timezone=True), nullable=True)  # When to stop showing
    
    # Display settings
    is_active = Column(Boolean, default=True)
    is_dismissible = Column(Boolean, default=True)  # Can users dismiss it?
    priority = Column(Integer, default=0)  # Higher priority banners show first
    
    # Targeting (JSON string for flexible targeting rules)
    # Examples: {"roles": ["buyer"], "tiers": ["premium"], "regions": ["harare"]}
    targeting_rules = Column(Text, nullable=True)
    
    # Metadata
    created_by = Column(Integer, nullable=True)  # User ID who created it
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Banner(id={self.banner_id}, title='{self.title}', platform='{self.platform}', type='{self.banner_type}')>"


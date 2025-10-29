from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class BuyerTier(str, Enum):
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"
    VIP = "vip"


class PaymentTerms(str, Enum):
    PREPAID = "prepaid"          # Payment before delivery
    COD = "cod"                  # Cash on delivery
    NET_7 = "net_7"              # Payment within 7 days
    NET_15 = "net_15"            # Payment within 15 days
    NET_30 = "net_30"            # Payment within 30 days


class BuyerStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DEACTIVATED = "deactivated"


class Buyer(Base):
    __tablename__ = "buyers"
    
    # Primary key
    buyer_id = Column(Integer, primary_key=True, index=True)
    
    # Link to user account
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True, index=True)
    
    # Company information
    company_name = Column(String(200), nullable=False)
    business_type = Column(String(50), nullable=True)  # restaurant, retailer, wholesaler, etc.
    
    # Tax and legal
    tax_number = Column(String(50), nullable=True, index=True)
    vat_number = Column(String(50), nullable=True)
    business_registration_number = Column(String(50), nullable=True)
    
    # Contact details
    business_phone = Column(String(20), nullable=True)
    business_email = Column(String(100), nullable=True)
    website = Column(String(200), nullable=True)
    
    # Billing address
    billing_address_line1 = Column(String(200), nullable=True)
    billing_address_line2 = Column(String(200), nullable=True)
    billing_city = Column(String(100), nullable=True)
    billing_district = Column(String(100), nullable=True)
    billing_province = Column(String(100), nullable=True)
    billing_postal_code = Column(String(20), nullable=True)
    
    # Delivery preferences (JSON)
    # Example: {
    #   "preferred_times": ["morning", "afternoon"],
    #   "delivery_instructions": "Use back entrance",
    #   "contact_person": "John Doe",
    #   "contact_phone": "+263..."
    # }
    delivery_prefs_json = Column(Text, nullable=True)
    
    # Default delivery address (can be overridden per order)
    default_delivery_address_line1 = Column(String(200), nullable=True)
    default_delivery_address_line2 = Column(String(200), nullable=True)
    default_delivery_city = Column(String(100), nullable=True)
    default_delivery_district = Column(String(100), nullable=True)
    default_delivery_province = Column(String(100), nullable=True)
    default_delivery_postal_code = Column(String(20), nullable=True)
    
    # Business tier and status
    buyer_tier = Column(SQLEnum(BuyerTier), default=BuyerTier.BASIC)
    status = Column(SQLEnum(BuyerStatus), default=BuyerStatus.PENDING)
    
    # Payment terms and credit
    payment_terms = Column(SQLEnum(PaymentTerms), default=PaymentTerms.PREPAID)
    credit_limit = Column(Float, default=0.0)
    current_credit_used = Column(Float, default=0.0)
    
    # Verification and compliance
    is_verified = Column(Boolean, default=False)
    verification_documents = Column(Text, nullable=True)  # JSON array of document URLs
    compliance_notes = Column(Text, nullable=True)
    
    # Trading statistics
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    average_order_value = Column(Float, default=0.0)
    
    # Preferences
    preferred_crops = Column(Text, nullable=True)        # JSON array of crop IDs
    preferred_districts = Column(Text, nullable=True)    # JSON array of preferred source districts
    quality_requirements = Column(Text, nullable=True)   # JSON of quality specifications
    
    # Communication preferences
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    whatsapp_notifications = Column(Boolean, default=True)
    
    # Rating and reputation
    average_rating = Column(Float, nullable=True)  # Based on supplier feedback
    total_ratings = Column(Integer, default=0)
    
    # Risk assessment
    risk_level = Column(String(20), default="low")  # low, medium, high
    last_risk_assessment = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_order_date = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User")
    orders = relationship("Order", back_populates="buyer")
    
    @property
    def available_credit(self):
        """Calculate available credit balance"""
        return self.credit_limit - self.current_credit_used
    
    @property
    def has_credit_available(self):
        """Check if buyer has credit available"""
        return self.available_credit > 0
    
    def __repr__(self):
        return f"<Buyer(id={self.buyer_id}, company='{self.company_name}', tier='{self.buyer_tier}')>"

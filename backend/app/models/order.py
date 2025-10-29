from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class OrderStatus(str, Enum):
    DRAFT = "draft"                          # Order being created
    PENDING_PAYMENT = "pending_payment"      # Awaiting buyer payment
    PAID = "paid"                           # Payment received, in escrow
    ALLOCATED = "allocated"                 # Assigned to farmers/lots
    DISPATCHED = "dispatched"               # Shipped/en route
    DELIVERED = "delivered"                 # Delivered to buyer
    QC_PASSED = "qc_passed"                # Quality control passed
    PAYOUT_SCHEDULED = "payout_scheduled"   # Farmer payout queued
    PAYOUT_COMPLETE = "payout_complete"     # Farmer payout completed
    QC_FAILED = "qc_failed"                # Quality control failed
    SHORT_SHIPPED = "short_shipped"         # Partial delivery
    CANCELLED = "cancelled"                 # Order cancelled
    REFUNDED = "refunded"                   # Refund processed
    DISPUTED = "disputed"                   # Under dispute investigation


class Order(Base):
    __tablename__ = "orders"
    
    # Primary key
    order_id = Column(Integer, primary_key=True, index=True)
    
    # Order identification
    order_number = Column(String(50), nullable=False, unique=True, index=True)
    
    # Buyer information
    buyer_id = Column(Integer, ForeignKey("buyers.buyer_id"), nullable=False, index=True)
    
    # Order totals
    subtotal = Column(Float, nullable=False, default=0.0)
    delivery_fee = Column(Float, nullable=False, default=0.0)
    service_fee = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    total = Column(Float, nullable=False)
    
    # Currency
    currency = Column(String(3), default="USD")
    
    # Status tracking
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.DRAFT)
    
    # Payment information
    payment_id = Column(Integer, ForeignKey("payments.payment_id"), nullable=True, index=True)
    payment_method = Column(String(50), nullable=True)
    
    # Delivery information
    delivery_address_line1 = Column(String(200), nullable=False)
    delivery_address_line2 = Column(String(200), nullable=True)
    delivery_city = Column(String(100), nullable=False)
    delivery_district = Column(String(100), nullable=False)
    delivery_province = Column(String(100), nullable=False)
    delivery_postal_code = Column(String(20), nullable=True)
    
    # Delivery contact
    delivery_contact_name = Column(String(100), nullable=True)
    delivery_contact_phone = Column(String(20), nullable=True)
    delivery_instructions = Column(Text, nullable=True)
    
    # Timing
    requested_delivery_date = Column(DateTime(timezone=True), nullable=True)
    promised_delivery_date = Column(DateTime(timezone=True), nullable=True)
    actual_delivery_date = Column(DateTime(timezone=True), nullable=True)
    
    # Estimated timing
    eta = Column(DateTime(timezone=True), nullable=True)
    
    # Order metadata
    order_notes = Column(Text, nullable=True)
    internal_notes = Column(Text, nullable=True)  # Admin/ops notes
    
    # Negotiation history (JSON)
    negotiation_history = Column(Text, nullable=True)
    
    # Quality requirements
    quality_requirements = Column(Text, nullable=True)  # JSON of specific quality needs
    
    # Special handling
    requires_cold_chain = Column(Boolean, default=False)
    temperature_requirements = Column(String(50), nullable=True)
    
    # Invoice and documentation
    invoice_number = Column(String(50), nullable=True, unique=True)
    invoice_generated = Column(Boolean, default=False)
    invoice_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    buyer = relationship("Buyer", back_populates="orders")
    # payment = relationship("Payment", foreign_keys="Payment.order_id", back_populates="order")  # Temporarily disabled for MVP
    order_items = relationship("OrderItem", back_populates="order")
    shipments = relationship("Shipment", back_populates="order")
    
    @property
    def total_weight_kg(self):
        """Calculate total weight of all items in the order"""
        return sum(item.qty_kg for item in self.order_items)
    
    @property
    def total_items(self):
        """Count total number of line items"""
        return len(self.order_items)
    
    def __repr__(self):
        return f"<Order(id={self.order_id}, number='{self.order_number}', status='{self.status}', total=${self.total})>"


class OrderItem(Base):
    __tablename__ = "order_items"
    
    # Primary key
    order_item_id = Column(Integer, primary_key=True, index=True)
    
    # Parent order
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    
    # Product information
    listing_id = Column(Integer, ForeignKey("listings.listing_id"), nullable=False, index=True)
    
    # Quantity and pricing
    qty_kg = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)  # Price per kg
    line_total = Column(Float, nullable=False)
    
    # Allocation to specific lots (JSON)
    # Example: [{"lot_id": 123, "qty_kg": 50, "farmer_payout": 45.0}, {"lot_id": 124, "qty_kg": 30, "farmer_payout": 27.0}]
    alloc_json = Column(Text, nullable=True)
    
    # Quality specifications for this line item
    requested_grade = Column(String(10), nullable=True)
    quality_notes = Column(Text, nullable=True)
    
    # Fulfillment tracking
    allocated_kg = Column(Float, default=0.0)
    shipped_kg = Column(Float, default=0.0)
    delivered_kg = Column(Float, default=0.0)
    
    # Quality control results
    qc_passed_kg = Column(Float, default=0.0)
    qc_failed_kg = Column(Float, default=0.0)
    qc_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    listing = relationship("Listing", back_populates="order_items")
    # lot = relationship("Lot", back_populates="order_items")  # Remove this to avoid circular dependency for now
    
    @property
    def fulfillment_percentage(self):
        """Calculate what percentage of the order has been fulfilled"""
        if self.qty_kg > 0:
            return (self.delivered_kg / self.qty_kg) * 100
        return 0
    
    @property
    def is_fully_allocated(self):
        """Check if this line item is fully allocated to lots"""
        return self.allocated_kg >= self.qty_kg
    
    def __repr__(self):
        return f"<OrderItem(id={self.order_item_id}, order={self.order_id}, qty={self.qty_kg}kg, price=${self.unit_price}/kg)>"

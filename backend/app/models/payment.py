from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class PaymentMethod(str, Enum):
    CASH_USD = "cash_usd"
    CASH_ZWL = "cash_zwl"
    VISA = "visa"
    MASTERCARD = "mastercard"
    ZIPIT = "zipit"
    RTGS = "rtgs"
    ECOCASH = "ecocash"
    NOSTRO = "nostro"
    BANK_TRANSFER = "bank_transfer"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"
    DISPUTED = "disputed"


class PayoutMethod(str, Enum):
    CASH_USD_COD = "cash_usd_cod"  # Cash on delivery
    ZIPIT = "zipit"
    RTGS = "rtgs"
    ECOCASH = "ecocash"
    NOSTRO = "nostro"
    BANK_TRANSFER = "bank_transfer"


class PayoutStatus(str, Enum):
    PENDING = "pending"
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    ON_HOLD = "on_hold"


class Payment(Base):
    __tablename__ = "payments"
    
    # Primary key
    payment_id = Column(Integer, primary_key=True, index=True)
    
    # Order reference
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False, index=True)
    
    # Payment identification
    payment_reference = Column(String(100), nullable=False, unique=True, index=True)
    external_transaction_id = Column(String(100), nullable=True, index=True)  # Gateway transaction ID
    
    # Payment details
    method = Column(SQLEnum(PaymentMethod), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    
    # Exchange rate information (for ZWL payments)
    exchange_rate = Column(Float, nullable=True)
    amount_local_currency = Column(Float, nullable=True)
    
    # Payment gateway information
    gateway_provider = Column(String(50), nullable=True)  # stripe, ecocash, zipit, etc.
    gateway_response = Column(Text, nullable=True)  # JSON response from gateway
    
    # Status tracking
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    
    # Escrow management
    escrow_amount = Column(Float, nullable=True)
    escrow_release_ts = Column(DateTime(timezone=True), nullable=True)
    escrow_released = Column(Boolean, default=False)
    
    # Fee breakdown
    processing_fee = Column(Float, default=0.0)
    gateway_fee = Column(Float, default=0.0)
    imtt_fee = Column(Float, default=0.0)  # Intermediated Money Transfer Tax
    
    # Refund information
    refund_amount = Column(Float, default=0.0)
    refund_reason = Column(String(200), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    authorized_at = Column(DateTime(timezone=True), nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    # order = relationship("Order", back_populates="payment")  # Temporarily disabled for MVP
    
    @property
    def net_amount(self):
        """Net amount after deducting fees"""
        return self.amount - self.processing_fee - self.gateway_fee - self.imtt_fee
    
    def __repr__(self):
        return f"<Payment(id={self.payment_id}, order={self.order_id}, method='{self.method}', amount=${self.amount}, status='{self.status}')>"


class Payout(Base):
    __tablename__ = "payouts"
    
    # Primary key
    payout_id = Column(Integer, primary_key=True, index=True)
    
    # Farmer information
    farmer_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)
    
    # Source lot/order information
    lot_id = Column(Integer, ForeignKey("lots.lot_id"), nullable=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=True, index=True)
    
    # Payout identification
    payout_reference = Column(String(100), nullable=False, unique=True, index=True)
    external_transaction_id = Column(String(100), nullable=True, index=True)
    
    # Amount details
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    
    # Exchange rate (if paying in local currency)
    exchange_rate = Column(Float, nullable=True)
    amount_local_currency = Column(Float, nullable=True)
    
    # Payout method
    method = Column(SQLEnum(PayoutMethod), nullable=False)
    
    # Recipient account details (encrypted/hashed for security)
    recipient_account_details = Column(Text, nullable=True)  # JSON with account info
    
    # Fee deductions
    processing_fee = Column(Float, default=0.0)
    imtt_fee = Column(Float, default=0.0)
    
    # Status and processing
    status = Column(SQLEnum(PayoutStatus), default=PayoutStatus.PENDING)
    
    # Scheduling
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    
    # Completion tracking
    completed_at = Column(DateTime(timezone=True), nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Approval workflow
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_user_id], back_populates="payouts")
    lot = relationship("Lot", foreign_keys=[lot_id])
    order = relationship("Order", foreign_keys=[order_id])
    approver = relationship("User", foreign_keys=[approved_by])
    
    @property
    def net_payout(self):
        """Net payout amount after fees"""
        return self.amount - self.processing_fee - self.imtt_fee
    
    def __repr__(self):
        return f"<Payout(id={self.payout_id}, farmer={self.farmer_user_id}, amount=${self.amount}, status='{self.status}')>"

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
from ..core.database import Base


class AuditAction(str, Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    VIEW = "view"
    LOGIN = "login"
    LOGOUT = "logout"
    APPROVE = "approve"
    REJECT = "reject"
    CANCEL = "cancel"
    PAYMENT = "payment"
    PAYOUT = "payout"
    NEGOTIATE = "negotiate"
    SHIP = "ship"
    DELIVER = "deliver"
    QC_CHECK = "qc_check"


class AuditEntity(str, Enum):
    USER = "user"
    FARM = "farm"
    CROP = "crop"
    PRODUCTION_PLAN = "production_plan"
    LOT = "lot"
    PRICE_RULE = "price_rule"
    LISTING = "listing"
    BUYER = "buyer"
    ORDER = "order"
    ORDER_ITEM = "order_item"
    PAYMENT = "payment"
    PAYOUT = "payout"
    SHIPMENT = "shipment"
    QC_CHECK = "qc_check"
    SYSTEM = "system"


class AuditLog(Base):
    __tablename__ = "audit_log"
    
    # Primary key
    audit_id = Column(Integer, primary_key=True, index=True)
    
    # Who performed the action
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)  # Nullable for system actions
    user_role = Column(String(20), nullable=True)
    user_name = Column(String(100), nullable=True)  # Stored for historical reference
    
    # What was acted upon
    entity = Column(SQLEnum(AuditEntity), nullable=False, index=True)
    entity_id = Column(Integer, nullable=True, index=True)  # ID of the affected record
    
    # What action was performed
    action = Column(SQLEnum(AuditAction), nullable=False, index=True)
    
    # Changes made (JSON)
    # For CREATE: {"new_values": {...}}
    # For UPDATE: {"old_values": {...}, "new_values": {...}, "changed_fields": [...]}
    # For DELETE: {"deleted_values": {...}}
    diff = Column(Text, nullable=True)
    
    # Context and metadata
    description = Column(Text, nullable=True)  # Human-readable description
    request_id = Column(String(50), nullable=True, index=True)  # To group related actions
    session_id = Column(String(100), nullable=True, index=True)
    
    # Request information
    ip_address = Column(String(45), nullable=True, index=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)
    http_method = Column(String(10), nullable=True)
    endpoint = Column(String(200), nullable=True)
    
    # Business context
    order_id = Column(Integer, nullable=True, index=True)  # Related order if applicable
    lot_id = Column(Integer, nullable=True, index=True)    # Related lot if applicable
    farm_id = Column(Integer, nullable=True, index=True)   # Related farm if applicable
    
    # Risk and compliance
    risk_level = Column(String(20), default="low", index=True)  # low, medium, high, critical
    requires_approval = Column(String(50), nullable=True)  # If action needs approval
    approved_by = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Financial impact
    financial_impact = Column(String(100), nullable=True)  # Amount and currency if applicable
    
    # System information
    application_version = Column(String(20), nullable=True)
    api_version = Column(String(20), nullable=True)
    
    # Timestamps
    ts = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="audit_logs")
    approver = relationship("User", foreign_keys=[approved_by])
    
    def __repr__(self):
        return f"<AuditLog(id={self.audit_id}, user={self.user_name}, action='{self.action}', entity='{self.entity}')>"


# Additional audit-related models for compliance

class SecurityEvent(Base):
    __tablename__ = "security_events"
    
    # Primary key
    event_id = Column(Integer, primary_key=True, index=True)
    
    # Event details
    event_type = Column(String(50), nullable=False, index=True)  # failed_login, suspicious_activity, etc.
    severity = Column(String(20), default="low", index=True)    # low, medium, high, critical
    
    # User context (if applicable)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True, index=True)
    attempted_username = Column(String(100), nullable=True)
    
    # Request information
    ip_address = Column(String(45), nullable=False, index=True)
    user_agent = Column(Text, nullable=True)
    
    # Event details
    description = Column(Text, nullable=False)
    raw_data = Column(Text, nullable=True)  # JSON with full event data
    
    # Response actions
    blocked = Column(String(50), default=False)
    alert_sent = Column(String(50), default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<SecurityEvent(id={self.event_id}, type='{self.event_type}', severity='{self.severity}')>"

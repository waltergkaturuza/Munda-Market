from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from enum import Enum
import hashlib

from ..core.database import Base


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FARMER = "FARMER" 
    BUYER = "BUYER"
    OPS = "OPS"


class UserStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED" 
    DEACTIVATED = "DEACTIVATED"


class User(Base):
    __tablename__ = "users"
    
    # Primary key
    user_id = Column(Integer, primary_key=True, index=True)
    
    # Basic info
    role = Column(SQLEnum(UserRole), nullable=False)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=True, index=True)
    
    # Security
    hashed_password = Column(String(255), nullable=False)
    gov_id_hash = Column(String(64), nullable=True, index=True)  # SHA-256 hash of gov ID
    
    # Status and verification
    status = Column(SQLEnum(UserStatus), default=UserStatus.PENDING)
    is_verified = Column(Boolean, default=False)
    verification_documents = Column(Text, nullable=True)  # JSON string
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Profile data (JSON)
    profile_data = Column(Text, nullable=True)  # Store role-specific data as JSON
    
    # Relationships
    farms = relationship("Farm", back_populates="owner")
    audit_logs = relationship("AuditLog", foreign_keys="AuditLog.user_id", back_populates="user")
    payouts = relationship("Payout", foreign_keys="Payout.farmer_user_id", back_populates="farmer")
    
    def __repr__(self):
        return f"<User(id={self.user_id}, role={self.role}, name='{self.name}')>"
    
    @staticmethod
    def hash_gov_id(gov_id: str) -> str:
        """Hash government ID for privacy"""
        return hashlib.sha256(gov_id.encode()).hexdigest()
    
    def verify_password(self, password: str) -> bool:
        """Verify password against stored hash"""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.verify(password, self.hashed_password)
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password for storage"""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        return pwd_context.hash(password)

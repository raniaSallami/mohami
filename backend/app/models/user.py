"""
User model for authentication and authorization.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
import uuid
import enum

from app.database import Base


class UserRole(str, enum.Enum):
    """User roles for role-based access control."""
    ADMIN = "ADMIN"
    LAWYER = "LAWYER"
    CLIENT = "CLIENT"


class SubscriptionPlan(str, enum.Enum):
    """Subscription plans with different feature limits."""
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    """User subscription status."""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"


class User(Base):
    """
    User model for authentication and user management.
    Supports multi-tenant architecture with organization_owner_id.
    """
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Authentication fields
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Authorization
    role: Mapped[str] = mapped_column(String(50), default=UserRole.CLIENT.value, nullable=False)
    
    # Subscription
    subscription_plan: Mapped[str] = mapped_column(String(50), default=SubscriptionPlan.BASIC.value)
    subscription_status: Mapped[str] = mapped_column(String(50), default=SubscriptionStatus.ACTIVE.value)
    
    # Profile
    avatar: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    allowed_ip: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    # Two‑factor authentication (TOTP)
    totp_secret: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Multi-tenant / Organization
    # If set, this user belongs to an organization (team)
    organization_owner_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cases: Mapped[List["Case"]] = relationship("Case", back_populates="user", cascade="all, delete-orphan")
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="user", cascade="all, delete-orphan")
    events: Mapped[List["Event"]] = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    chat_conversations: Mapped[List["ChatConversation"]] = relationship(
        "ChatConversation", 
        back_populates="user", 
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
    
    @property
    def is_admin(self) -> bool:
        return self.role == UserRole.ADMIN.value
    
    @property
    def is_lawyer(self) -> bool:
        return self.role == UserRole.LAWYER.value
    
    @property
    def is_client(self) -> bool:
        return self.role == UserRole.CLIENT.value
    
    @property
    def is_active(self) -> bool:
        return self.subscription_status == SubscriptionStatus.ACTIVE.value


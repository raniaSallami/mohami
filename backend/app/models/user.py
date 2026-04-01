"""
User model for authentication and authorization.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Text, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
import enum

from app.database import Base
from app.models.tenant import LoginEmailOTP
from sqlalchemy.dialects.postgresql import UUID


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    LAWYER = "LAWYER"
    CLIENT = "CLIENT"


class SubscriptionPlan(str, enum.Enum):
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.CLIENT.value, nullable=False)
    subscription_plan: Mapped[str] = mapped_column(String(50), default=SubscriptionPlan.BASIC.value)
    subscription_status: Mapped[str] = mapped_column(String(50), default=SubscriptionStatus.ACTIVE.value)
    avatar: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    allowed_ip: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    totp_secret: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    organization_owner_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    password_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=None)

    # Relationships
    cases: Mapped[List["Case"]] = relationship("Case", back_populates="user", cascade="all, delete-orphan")
    contracts: Mapped[List["Contract"]] = relationship("Contract", back_populates="user", cascade="all, delete-orphan")
    events: Mapped[List["Event"]] = relationship("Event", back_populates="user", cascade="all, delete-orphan")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    chat_conversations: Mapped[List["ChatConversation"]] = relationship("ChatConversation", back_populates="user", cascade="all, delete-orphan")
    known_devices: Mapped[List["KnownDevice"]] = relationship("KnownDevice", back_populates="user", cascade="all, delete-orphan")
    login_history: Mapped[List["LoginHistory"]] = relationship("LoginHistory", back_populates="user", cascade="all, delete-orphan")
    login_otps: Mapped[List["LoginEmailOTP"]] = relationship("LoginEmailOTP", back_populates="user", cascade="all, delete-orphan")

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


class KnownDevice(Base):
    __tablename__ = "known_devices"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fingerprint: Mapped[str] = mapped_column(String(255), nullable=False)
    device_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="known_devices")


class LoginHistory(Base):
    __tablename__ = "login_history"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    device_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fingerprint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="success")
    is_new_device: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="login_history")
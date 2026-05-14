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
    __table_args__ = {"extend_existing": True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
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
    language: Mapped[str] = mapped_column(String(10), default="ar", nullable=False)
    organization_owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
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
    profile: Mapped[Optional["UserProfile"]] = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    payment_audit_logs: Mapped[List["PaymentAuditLog"]] = relationship("PaymentAuditLog", back_populates="user", cascade="all, delete-orphan")

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

    # Profile properties for easy access by serializers
    @property
    def account_type(self) -> Optional[str]:
        return self.profile.account_type if self.profile else None

    @account_type.setter
    def account_type(self, value):
        if not self.profile:
            from app.models.user_profile import UserProfile
            self.profile = UserProfile(user_id=self.id, account_type=value or "lawyer")
        else:
            self.profile.account_type = value

    @property
    def bar_number(self) -> Optional[str]:
        return self.profile.bar_number if self.profile else None

    @bar_number.setter
    def bar_number(self, value):
        if not self.profile:
            from app.models.user_profile import UserProfile
            self.profile = UserProfile(user_id=self.id, account_type="lawyer", bar_number=value)
        else:
            self.profile.bar_number = value

    @property
    def cabinet_name(self) -> Optional[str]:
        return self.profile.cabinet_name if self.profile else None

    @cabinet_name.setter
    def cabinet_name(self, value):
        if not self.profile:
            from app.models.user_profile import UserProfile
            self.profile = UserProfile(user_id=self.id, account_type="cabinet", cabinet_name=value)
        else:
            self.profile.cabinet_name = value

    @property
    def university(self) -> Optional[str]:
        return self.profile.university if self.profile else None

    @university.setter
    def university(self, value):
        if not self.profile:
            from app.models.user_profile import UserProfile
            self.profile = UserProfile(user_id=self.id, account_type="student", university=value)
        else:
            self.profile.university = value

    @property
    def bar_registration_number(self) -> Optional[str]:
        return self.profile.bar_registration_number if self.profile else None

    @bar_registration_number.setter
    def bar_registration_number(self, value):
        if not self.profile:
            from app.models.user_profile import UserProfile
            self.profile = UserProfile(user_id=self.id, account_type="cabinet", bar_registration_number=value)
        else:
            self.profile.bar_registration_number = value

    @property
    def office_address(self) -> Optional[str]:
        return self.profile.office_address if self.profile else None

    @office_address.setter
    def office_address(self, value):
        if not self.profile:
            from app.models.user_profile import UserProfile
            self.profile = UserProfile(user_id=self.id, account_type="lawyer", office_address=value)
        else:
            self.profile.office_address = value

    @property
    def number_of_lawyers(self) -> Optional[int]:
        return self.profile.number_of_lawyers if self.profile else None

    @number_of_lawyers.setter
    def number_of_lawyers(self, value):
        if not self.profile:
            from app.models.user_profile import UserProfile
            self.profile = UserProfile(user_id=self.id, account_type="cabinet", number_of_lawyers=value)
        else:
            self.profile.number_of_lawyers = value


class KnownDevice(Base):
    __tablename__ = "known_devices"
    __table_args__ = {"extend_existing": True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
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
    __table_args__ = {"extend_existing": True}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    device_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fingerprint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="success")
    is_new_device: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="login_history")
"""
Additional models: OTP, Team, and Platform Analytics.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from app.database import Base


class PasswordResetOTP(Base):
    """
    Password reset OTP for forgot password flow.
    """
    __tablename__ = "password_reset_otp"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<PasswordResetOTP(email={self.email})>"


class SignupEmailOTP(Base):
    """
    Email verification OTP for new user registration.
    """
    __tablename__ = "signup_email_otp"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<SignupEmailOTP(email={self.email})>"


class IPVerificationOTP(Base):
    """
    IP verification OTP for new device/IP login.
    """
    __tablename__ = "ip_verification_otp"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    new_ip: Mapped[str] = mapped_column(String(100), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<IPVerificationOTP(user_id={self.user_id}, ip={self.new_ip})>"


class TeamInvite(Base):
    """
    Team invitation for inviting users to an organization.
    """
    __tablename__ = "team_invites"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, accepted, expired
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Optional: role for the invited user
    role: Mapped[str] = mapped_column(String(50), default="LAWYER")
    
    def __repr__(self) -> str:
        return f"<TeamInvite(email={self.email}, status={self.status})>"


class InternalMessage(Base):
    """
    Internal messages between team members (direct messages).
    """
    __tablename__ = "internal_messages"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    from_user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    to_user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<InternalMessage(from={self.from_user_id}, to={self.to_user_id})>"


class PlatformVisitor(Base):
    """
    Platform visitor analytics tracking.
    """
    __tablename__ = "platform_visitors"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_visited: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    visit_date: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    is_unique: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<PlatformVisitor(session_id={self.session_id}, ip={self.ip_address})>"


class SystemSettings(Base):
    """
    System settings stored as key-value pairs.
    """
    __tablename__ = "system_settings"
    
    key: Mapped[str] = mapped_column(String(100), primary_key=True)
    value: Mapped[dict] = mapped_column(Text, nullable=False)  # JSON string
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<SystemSettings(key={self.key})>"


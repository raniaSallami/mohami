"""
User Profile model for storing additional user information.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.database import Base
from sqlalchemy.dialects.postgresql import UUID


class UserProfile(Base):
    """Store additional user profile information."""
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    
    # Account type (lawyer, cabinet, student)
    account_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # For lawyers
    bar_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # For cabinets
    cabinet_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    bar_registration_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    office_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    number_of_lawyers: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # For students
    university: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    faculty_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("faculties.id"), nullable=True, index=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="profile")
    faculty: Mapped[Optional["Faculty"]] = relationship("Faculty", back_populates="user_profiles", viewonly=True)

    def __repr__(self) -> str:
        return f"<UserProfile(user_id={self.user_id}, account_type={self.account_type})>"

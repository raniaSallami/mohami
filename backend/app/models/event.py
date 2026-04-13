"""
Event model for calendar and scheduling.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class Event(Base):
    """
    Calendar event model for scheduling appointments, hearings, etc.
    """
    __tablename__ = "events"
    
    # Primary key - use UUID(as_uuid=True) for native postgres UUID Support
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Event details
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)  # ISO date string YYYY-MM-DD
    time: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # HH:MM format
    type: Mapped[str] = mapped_column(String(100), nullable=False)  # appointment, hearing, deadline, etc.
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Reminder
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Foreign keys - use native UUID Support
    user_id: Mapped[Optional[str]] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    case_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="SET NULL"), nullable=True)
    
    # Tenant (organization)
    tenant_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="events")
    case: Mapped[Optional["Case"]] = relationship("Case", back_populates="events")
    
    def __repr__(self) -> str:
        return f"<Event(id={self.id}, title={self.title}, date={self.date})>"


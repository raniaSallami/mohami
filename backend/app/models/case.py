"""
Case model for legal case management.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

import uuid
import enum

from app.database import Base


class CaseStatus(str, enum.Enum):
    """Case status enumeration."""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"
    CANCELLED = "cancelled"


class CaseType(str, enum.Enum):
    """Types of legal cases."""
    CIVIL = "civil"
    CRIMINAL = "criminal"
    COMMERCIAL = "commercial"
    FAMILY = "family"
    LABOR = "labor"
    ADMINISTRATIVE = "administrative"
    COURSE = "course"
    OTHER = "other"


class Case(Base):
    """
    Legal case model for tracking client cases.
    """
    __tablename__ = "cases"
    
    # Primary key - use native UUID Support
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Case details
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)  # CaseType enum
    status: Mapped[str] = mapped_column(String(50), default=CaseStatus.PENDING.value)
    
    # Dates
    date_created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    date_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Content
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    analysis: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Documents stored as JSON array
    documents: Mapped[list] = mapped_column(JSONB, default=list)
    
    # AI Chat history
    chat_history: Mapped[list] = mapped_column(JSONB, default=list)
    
    # Foreign keys
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_by_user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    assigned_to_user_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Tenant (organization)
    tenant_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="cases")
    events: Mapped[List["Event"]] = relationship("Event", back_populates="case", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Case(id={self.id}, title={self.title}, status={self.status})>"


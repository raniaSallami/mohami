"""
Contract model for legal document management.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.database import Base


class Contract(Base):
    """
    Legal contract/document model.
    """
    __tablename__ = "contracts"
    
    # Primary key - use String(36) to store UUID as string
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Contract details
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "sale", "lease", "employment"
    parties: Mapped[str] = mapped_column(String(1000), nullable=False)  # Comma-separated party names
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Dates
    date_created: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    date_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata
    status: Mapped[str] = mapped_column(String(50), default="draft")  # draft, signed, expired
    
    # Foreign keys - use String(36) to store UUID as string
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Tenant (organization)
    tenant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="contracts")
    
    def __repr__(self) -> str:
        return f"<Contract(id={self.id}, title={self.title}, type={self.type})>"


"""
Invoice model for subscription payments.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
import enum

from app.database import Base


class InvoiceStatus(str, enum.Enum):
    """Invoice payment status."""
    PENDING = "pending"
    PAID = "paid"
    REJECTED = "rejected"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class Invoice(Base):
    """
    Invoice model for subscription payments.
    """
    __tablename__ = "invoices"
    
    # Primary key - use String(36) to store UUID as string
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Invoice details
    date: Mapped[str] = mapped_column(String(20), nullable=False)  # ISO date string
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default=InvoiceStatus.PENDING.value)
    plan_name: Mapped[str] = mapped_column(String(50), nullable=False)  # basic, pro, enterprise
    
    # Receipt data (could be base64 encoded or URL)
    receipt_data: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Dates
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys - use String(36) to store UUID as string
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Tenant (organization)
    tenant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="invoices")
    
    def __repr__(self) -> str:
        return f"<Invoice(id={self.id}, amount={self.amount}, status={self.status})>"


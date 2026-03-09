"""
Notification model for user notifications.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
import uuid

from app.database import Base


class Notification(Base):
    """
    Notification model for user alerts and messages.
    """
    __tablename__ = "notifications"
    
    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Notification details
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # info, warning, error, success
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Optional link for clickable notifications
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Additional metadata (JSON) - 'metadata' is reserved in SQLAlchemy, use extra_data
    extra_data: Mapped[dict] = mapped_column(JSONB, default=dict, name="metadata")
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Index for faster queries
    __table_args__ = (
        # Indexes are created via migration, but we can define here
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, title={self.title}, read={self.read})>"


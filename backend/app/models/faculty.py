"""
Faculty model for storing Tunisian legal faculties and institutions.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid

from app.database import Base
from sqlalchemy.dialects.postgresql import UUID, ARRAY


class Faculty(Base):
    """Stores all Tunisian legal faculties and institutions."""
    __tablename__ = "faculties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # faculte, institut, ecole
    domain: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # droit
    specialities: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, default=[])
    university: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, default="Tunisie")
    public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    level: Mapped[List[str]] = mapped_column(ARRAY(String), nullable=False, default=[])
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user_profiles: Mapped[List["UserProfile"]] = relationship("UserProfile", back_populates="faculty", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Faculty(id={self.id}, name={self.name}, type={self.type})>"

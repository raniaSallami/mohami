"""
Registration Email OTP for user sign-up verification.
"""
from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from app.database import Base


class RegistrationEmailOTP(Base):
    __tablename__ = "registration_email_otp"
    __table_args__ = {"extend_existing": True}
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<RegistrationEmailOTP(email={self.email}, otp=****{self.otp[-2:]})>"

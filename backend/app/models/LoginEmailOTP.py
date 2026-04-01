"""
Login Email OTP for 2FA login verification.
"""
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
import uuid

from app.database import Base
from app.models.user import User


class LoginEmailOTP(Base):
    __tablename__ = "login_email_otp"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    otp: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="login_otps")
    
    def __repr__(self) -> str:
        return f"<LoginEmailOTP(user_id={self.user_id}, otp=****{self.otp[-2:]})>"


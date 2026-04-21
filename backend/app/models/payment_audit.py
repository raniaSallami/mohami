"""
Payment audit log model.
"""
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid

from app.database import Base


class PaymentAuditLog(Base):
    """
    Table d'audit pour les transactions de paiement.
    Enregistre tous les événements liés aux abonnements pour conformité et débogage.
    """
    __tablename__ = "payment_audit_log"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Event details
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    # Event data
    details: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)

    # Metadata
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Security
    session_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    fingerprint: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Status tracking
    status: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)

    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="payment_audit_logs")

    def __repr__(self) -> str:
        return f"<PaymentAuditLog(id={self.id}, event={self.event_type}, user={self.user_id}, status={self.status})>"


class PaymentSecurityEvent(Base):
    """
    Table pour les événements de sécurité liés aux paiements.
    Enregistre les tentatives suspectes et les blocages.
    """
    __tablename__ = "payment_security_events"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Event details
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # low, medium, high, critical

    # Target identification
    user_id: Mapped[Optional[str]] = mapped_column(PG_UUID(as_uuid=True), nullable=True, index=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False, index=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Event data
    details: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    risk_score: Mapped[float] = mapped_column(nullable=False, index=True)

    # Actions taken
    action_taken: Mapped[str] = mapped_column(String(50), nullable=False)  # blocked, warned, logged
    blocked: Mapped[bool] = mapped_column(default=False, nullable=False, index=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<PaymentSecurityEvent(id={self.id}, type={self.event_type}, severity={self.severity}, blocked={self.blocked})>"


class SubscriptionMetrics(Base):
    """
    Table pour les métriques d'abonnement.
    Permet le suivi des KPI et des tendances.
    """
    __tablename__ = "subscription_metrics"

    # Primary key
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Metric details
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)

    # Values
    value: Mapped[float] = mapped_column(nullable=False)
    previous_value: Mapped[Optional[float]] = mapped_column(nullable=True)

    # Context
    plan_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    period: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # daily, weekly, monthly

    # Timestamps
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<SubscriptionMetrics(id={self.id}, type={self.metric_type}, name={self.metric_name}, value={self.value})>"

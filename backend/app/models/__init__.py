"""
Database models package.
Exports all SQLAlchemy models for the application.
"""
from app.models.user import User, UserRole, SubscriptionPlan, SubscriptionStatus
from app.models.case import Case, CaseStatus, CaseType
from app.models.contract import Contract
from app.models.event import Event
from app.models.invoice import Invoice, InvoiceStatus
from app.models.notification import Notification
from app.models.chat import ChatConversation, ChatMessage, TeamChatMessage
from app.models.tenant import (
    PasswordResetOTP,
    SignupEmailOTP,
    IPVerificationOTP,
    TeamInvite,
    InternalMessage,
    PlatformVisitor,
    SystemSettings,
)


__all__ = [
    # Base classes
    "Base",
    
    # User
    "User",
    "UserRole",
    "SubscriptionPlan",
    "SubscriptionStatus",
    
    # Case
    "Case",
    "CaseStatus",
    "CaseType",
    
    # Contract
    "Contract",
    
    # Event
    "Event",
    
    # Invoice
    "Invoice",
    "InvoiceStatus",
    
    # Notification
    "Notification",
    
    # Chat
    "ChatConversation",
    "ChatMessage",
    "TeamChatMessage",
    
    # Tenant/Additional
    "PasswordResetOTP",
    "SignupEmailOTP",
    "IPVerificationOTP",
    "TeamInvite",
    "InternalMessage",
    "PlatformVisitor",
    "SystemSettings",
]


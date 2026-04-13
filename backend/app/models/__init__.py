"""
Database models package.
Exports all SQLAlchemy models for the application.
"""
from app.models.user import User, UserRole, SubscriptionPlan, SubscriptionStatus
from app.models.user_profile import UserProfile
from app.models.faculty import Faculty
from app.models.case import Case, CaseStatus, CaseType
from app.models.contract import Contract
from app.models.event import Event
from app.models.invoice import Invoice, InvoiceStatus
from app.models.notification import Notification
from app.models.chat import ChatConversation, ChatMessage, TeamChatMessage
from app.models.registration_otp import RegistrationEmailOTP
from app.models.tenant import (
    LoginEmailOTP,
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
    "UserProfile",
    
    # Faculty
    "Faculty",
    
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
    
    # OTP
    "LoginEmailOTP",
    "RegistrationEmailOTP",
    
    # Tenant/Additional
    "PasswordResetOTP",
    "SignupEmailOTP",
    "IPVerificationOTP",
    "TeamInvite",
    "InternalMessage",
    "PlatformVisitor",
    "SystemSettings",
]

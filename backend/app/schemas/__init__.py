"""
Pydantic schemas package.
Exports all schemas for request/response validation.
"""
from app.schemas.auth import (
    Token,
    TokenPayload,
    RefreshTokenRequest,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserUpdateByAdmin,
    UserResponse,
    UserListResponse,
    ChangePasswordRequest,
    UpdatePlanRequest,
)
from app.schemas.case import (
    CaseBase,
    CaseCreate,
    CaseUpdate,
    CaseResponse,
    CaseListResponse,
    CaseFilter,
)
from app.schemas.contract import (
    ContractBase,
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    ContractListResponse,
)
from app.schemas.event import (
    EventBase,
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
)
from app.schemas.invoice import (
    InvoiceBase,
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceListResponse,
    InvoiceApproveRequest,
    InvoiceRejectRequest,
)
from app.schemas.notification import (
    NotificationBase,
    NotificationCreate,
    NotificationUpdate,
    NotificationResponse,
    NotificationListResponse,
    MarkAllReadResponse,
)
from app.schemas.chat import (
    ConversationBase,
    ConversationCreate,
    ConversationResponse,
    ConversationListResponse,
    MessageBase,
    MessageCreate,
    MessageResponse,
    MessageListResponse,
    ConversationWithMessages,
    TeamMessageCreate,
    TeamMessageResponse,
    TeamMessageListResponse,
)


__all__ = [
    # Auth
    "Token",
    "TokenPayload",
    "RefreshTokenRequest",
    "LoginRequest",
    "LoginResponse",
    "RegisterRequest",
    "RegisterResponse",
    "PasswordResetRequest",
    "PasswordResetConfirm",
    
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserUpdateByAdmin",
    "UserResponse",
    "UserListResponse",
    "ChangePasswordRequest",
    "UpdatePlanRequest",
    
    # Case
    "CaseBase",
    "CaseCreate",
    "CaseUpdate",
    "CaseResponse",
    "CaseListResponse",
    "CaseFilter",
    
    # Contract
    "ContractBase",
    "ContractCreate",
    "ContractUpdate",
    "ContractResponse",
    "ContractListResponse",
    
    # Event
    "EventBase",
    "EventCreate",
    "EventUpdate",
    "EventResponse",
    "EventListResponse",
    
    # Invoice
    "InvoiceBase",
    "InvoiceCreate",
    "InvoiceUpdate",
    "InvoiceResponse",
    "InvoiceListResponse",
    "InvoiceApproveRequest",
    "InvoiceRejectRequest",
    
    # Notification
    "NotificationBase",
    "NotificationCreate",
    "NotificationUpdate",
    "NotificationResponse",
    "NotificationListResponse",
    "MarkAllReadResponse",
    
    # Chat
    "ConversationBase",
    "ConversationCreate",
    "ConversationResponse",
    "ConversationListResponse",
    "MessageBase",
    "MessageCreate",
    "MessageResponse",
    "MessageListResponse",
    "ConversationWithMessages",
    "TeamMessageCreate",
    "TeamMessageResponse",
    "TeamMessageListResponse",
]


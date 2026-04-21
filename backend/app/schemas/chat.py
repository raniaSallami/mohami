"""
Pydantic schemas for chat operations.
"""
from datetime import datetime
from typing import Optional, List, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# Chat Conversation schemas
class ConversationBase(BaseModel):
    """Base conversation schema."""
    user_name: Optional[str] = None
    user_email: Optional[str] = None


class ConversationCreate(ConversationBase):
    """Schema for creating a new conversation."""
    user_id: Optional[str] = None


class ConversationResponse(BaseModel):
    """Schema for conversation response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: Union[str, UUID]
    user_id: Optional[Union[str, UUID]] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    tenant_id: Optional[str] = None


class ConversationListResponse(BaseModel):
    """Schema for conversation list response."""
    conversations: List[ConversationResponse]
    total: int


# Chat Message schemas
class MessageBase(BaseModel):
    """Base message schema."""
    message: str = Field(..., min_length=1)
    attachments: Optional[List[dict]] = None


class MessageCreate(MessageBase):
    """Schema for creating a new message."""
    sender_type: str = Field(..., pattern="^(user|admin)$")


class MessageResponse(BaseModel):
    """Schema for message response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: Union[str, UUID]
    conversation_id: Union[str, UUID]
    sender_type: str
    sender_id: Optional[Union[str, UUID]] = None
    sender_name: Optional[str] = None
    message: str
    attachments: List[Any] = []
    read: bool
    created_at: datetime


class MessageListResponse(BaseModel):
    """Schema for message list response."""
    messages: List[MessageResponse]
    total: int


# Full conversation with messages
class ConversationWithMessages(ConversationResponse):
    """Schema for conversation with all messages."""
    messages: List[MessageResponse] = []


# Team chat schemas
class TeamMessageCreate(BaseModel):
    """Schema for creating a team chat message."""
    message: str = Field(..., min_length=1)


class TeamMessageResponse(BaseModel):
    """Schema for team message response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: Union[str, UUID]
    owner_id: Union[str, UUID]
    from_user_id: Union[str, UUID]
    from_user_name: Optional[str] = None
    message: str
    created_at: datetime


class TeamMessageListResponse(BaseModel):
    """Schema for team message list response."""
    messages: List[TeamMessageResponse]
    total: int


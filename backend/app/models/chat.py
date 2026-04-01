"""
Chat models for user support conversations.
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB
import uuid

from app.database import Base


class ChatConversation(Base):
    """
    Chat conversation between users and admins/support.
    """
    __tablename__ = "chat_conversations"
    
    # Primary key - use String(36) to store UUID as string
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # User info (nullable for guest conversations) - use String(36) to store UUID as string
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Conversation status
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, closed
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Tenant (organization)
    tenant_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True, index=True)
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User", back_populates="chat_conversations")
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", 
        back_populates="conversation", 
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at"
    )
    
    def __repr__(self) -> str:
        return f"<ChatConversation(id={self.id}, user_name={self.user_name}, status={self.status})>"


class ChatMessage(Base):
    """
    Individual message in a chat conversation.
    """
    __tablename__ = "chat_messages"
    
    # Primary key - use String(36) to store UUID as string
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Conversation reference - use String(36) to store UUID as string
    conversation_id: Mapped[str] = mapped_column(
        String(36), 
        ForeignKey("chat_conversations.id", ondelete="CASCADE"), 
        nullable=False
    )
    
    # Sender info
    sender_type: Mapped[str] = mapped_column(String(50), nullable=False)  # user, admin
    sender_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    sender_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Message content
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Attachments (JSON array)
    attachments: Mapped[list] = mapped_column(JSONB, default=list)
    
    # Read status
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Relationships
    conversation: Mapped["ChatConversation"] = relationship("ChatConversation", back_populates="messages")
    
    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, sender_type={self.sender_type})>"


# Team Chat Models (internal team messaging)


class TeamChatMessage(Base):
    """
    Team group chat messages (visible to all team members).
    """
    __tablename__ = "team_chat_messages"
    
    # Primary key - use String(36) to store UUID as string
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Owner (organization)
    owner_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    
    # Sender info
    from_user_id: Mapped[str] = mapped_column(String(36), nullable=False)
    from_user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Message content
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Timestamp
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    def __repr__(self) -> str:
        return f"<TeamChatMessage(id={self.id}, from_user_id={self.from_user_id})>"


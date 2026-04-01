"""
Chat management routes.
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime
import json
import logging

from app.database import get_db
from app.models.user import User
from app.models.chat import ChatConversation, ChatMessage, TeamChatMessage
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    ConversationListResponse,
    MessageCreate,
    MessageResponse,
    MessageListResponse,
    ConversationWithMessages,
    TeamMessageCreate,
    TeamMessageResponse,
    TeamMessageListResponse,
)
from app.utils.security import get_current_active_user

logger = logging.getLogger(__name__)

# Store active WebSocket connections
connections: dict = {}  # {conversation_id: set of WebSocket connections}

router = APIRouter(tags=["Chat"])


# User Chat Routes
@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List chat conversations for the current user."""
    query = select(ChatConversation)
    
    # Filter by user_id or show all for admin
    if current_user.role != "ADMIN":
        query = query.where(ChatConversation.user_id == current_user.id)
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(ChatConversation.updated_at.desc())
    
    result = await db.execute(query)
    conversations = result.scalars().all()
    
    return ConversationListResponse(
        conversations=[ConversationResponse.model_validate(c) for c in conversations],
        total=total
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a conversation with all messages."""
    result = await db.execute(
        select(ChatConversation).where(ChatConversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Get messages
    messages_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversation_id == conversation_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = messages_result.scalars().all()
    
    return ConversationWithMessages(
        **ConversationResponse.model_validate(conversation).model_dump(),
        messages=[MessageResponse.model_validate(m) for m in messages]
    )


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new chat conversation."""
    conversation = ChatConversation(
        user_id=current_user.id,
        user_name=conversation_data.user_name or current_user.name,
        user_email=conversation_data.user_email or current_user.email,
        status="active"
    )
    
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    
    return ConversationResponse.model_validate(conversation)


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: str,
    message_data: MessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message in a conversation."""
    # Verify conversation exists
    conv_result = await db.execute(
        select(ChatConversation).where(ChatConversation.id == conversation_id)
    )
    conversation = conv_result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Determine sender info
    sender_type = message_data.sender_type
    sender_id = current_user.id if sender_type == "user" else None
    sender_name = current_user.name
    
    message = ChatMessage(
        conversation_id=conversation_id,
        sender_type=sender_type,
        sender_id=sender_id,
        sender_name=sender_name,
        message=message_data.message,
        attachments=message_data.attachments or []
    )
    
    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()
    conversation.last_message_at = datetime.utcnow()
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    return MessageResponse.model_validate(message)


@router.post("/conversations/{conversation_id}/close")
async def close_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Close a conversation."""
    result = await db.execute(
        select(ChatConversation).where(ChatConversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    conversation.status = "closed"
    await db.commit()
    
    return {"message": "Conversation closed"}


# Team Chat Routes
@router.get("/team/messages", response_model=TeamMessageListResponse)
async def get_team_messages(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get team chat messages (for organization members)."""
    # Get owner_id for team
    owner_id = current_user.organization_owner_id or current_user.id
    
    result = await db.execute(
        select(TeamChatMessage)
        .where(TeamChatMessage.owner_id == owner_id)
        .order_by(TeamChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()
    
    return TeamMessageListResponse(
        messages=[TeamMessageResponse.model_validate(m) for m in messages],
        total=len(messages)
    )


@router.post("/team/messages", response_model=TeamMessageResponse)
async def send_team_message(
    message_data: TeamMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Send a message to team chat."""
    # Get owner_id for team
    owner_id = current_user.organization_owner_id or current_user.id
    
    message = TeamChatMessage(
        owner_id=owner_id,
        from_user_id=current_user.id,
        from_user_name=current_user.name,
        message=message_data.message
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    return TeamMessageResponse.model_validate(message)


# WebSocket endpoint for real-time chat
@router.websocket("/ws/conversations/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    """WebSocket endpoint for real-time conversation updates."""
    await websocket.accept()
    
    # Add connection to tracking
    if conversation_id not in connections:
        connections[conversation_id] = set()
    connections[conversation_id].add(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            logger.info(f"WebSocket message in {conversation_id}: {message_data.get('type')}")
            
            # Handle different message types
            if message_data.get("type") == "message":
                # Broadcast message to all connected clients
                for connection in connections[conversation_id]:
                    try:
                        await connection.send_text(json.dumps({
                            "type": "message",
                            "data": message_data.get("data"),
                            "timestamp": datetime.utcnow().isoformat()
                        }))
                    except Exception as e:
                        logger.error(f"Error sending to WebSocket: {e}")
            
            elif message_data.get("type") == "typing":
                # Broadcast typing indicator
                for connection in connections[conversation_id]:
                    if connection != websocket:
                        try:
                            await connection.send_text(json.dumps({
                                "type": "typing",
                                "user": message_data.get("user")
                            }))
                        except Exception as e:
                            logger.error(f"Error broadcasting typing: {e}")
    
    except WebSocketDisconnect:
        if conversation_id in connections:
            connections[conversation_id].discard(websocket)
            # Notify others that user disconnected
            for connection in connections[conversation_id]:
                try:
                    await connection.send_text(json.dumps({
                        "type": "user_left",
                        "timestamp": datetime.utcnow().isoformat()
                    }))
                except Exception as e:
                    logger.error(f"Error notifying disconnect: {e}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        if conversation_id in connections:
            connections[conversation_id].discard(websocket)

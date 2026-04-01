"""
WebSocket Server - FastAPI equivalent of websocket-server.cjs
Handles real-time chat between users and admins.
"""
import asyncio
import json
import os
import sys
import re
from datetime import datetime
from typing import Dict, Set, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Database ─────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

# Reuse existing database setup
from app.database import AsyncSessionLocal
from sqlalchemy import text

WS_PORT = int(os.getenv("WS_PORT", "8082"))

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="Mouhami WebSocket Server")

# Store active connections
connections: Dict[str, Set[WebSocket]] = {}       # conversationId -> Set of WebSocket
user_connections: Dict[str, Set[WebSocket]] = {}  # userId -> Set of WebSocket


# ── Chat Service (equivalent of chatService.cjs) ──────────────────────────────
async def get_messages(conversation_id: str) -> list:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("SELECT * FROM chat_messages WHERE conversation_id = :cid ORDER BY created_at ASC"),
            {"cid": conversation_id}
        )
        rows = result.mappings().all()
        messages = []
        for row in rows:
            msg = dict(row)
            # Parse attachments JSON
            if msg.get("attachments"):
                if isinstance(msg["attachments"], str):
                    try:
                        msg["attachments"] = json.loads(msg["attachments"])
                    except Exception:
                        msg["attachments"] = []
            else:
                msg["attachments"] = []
            # Convert datetime to string
            for key, val in msg.items():
                if isinstance(val, datetime):
                    msg[key] = val.isoformat()
            messages.append(msg)
        return messages


async def add_message(
    conversation_id: str,
    sender_type: str,
    sender_id: Optional[str],
    sender_name: str,
    message: str,
    attachments: list = []
) -> dict:
    import random, string
    msg_id = f"msg_{int(datetime.utcnow().timestamp() * 1000)}_{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
    now = datetime.utcnow().isoformat()

    async with AsyncSessionLocal() as db:
        await db.execute(
            text("""
                INSERT INTO chat_messages
                    (id, conversation_id, sender_type, sender_id, sender_name, message, created_at, read, attachments)
                VALUES
                    (:id, :cid, :stype, :sid, :sname, :msg, :now, false, :att)
            """),
            {
                "id": msg_id,
                "cid": conversation_id,
                "stype": sender_type,
                "sid": sender_id,
                "sname": sender_name,
                "msg": message,
                "now": now,
                "att": json.dumps(attachments),
            }
        )
        await db.execute(
            text("UPDATE chat_conversations SET updated_at = :now, last_message_at = :now WHERE id = :cid"),
            {"now": now, "cid": conversation_id}
        )
        await db.commit()

    return {
        "id": msg_id,
        "conversationId": conversation_id,
        "senderType": sender_type,
        "senderId": sender_id,
        "senderName": sender_name,
        "message": message,
        "createdAt": now,
        "read": False,
        "attachments": attachments,
    }


async def mark_messages_as_read(conversation_id: str, sender_type: str):
    opposite = "admin" if sender_type == "user" else "user"
    async with AsyncSessionLocal() as db:
        await db.execute(
            text("UPDATE chat_messages SET read = TRUE WHERE conversation_id = :cid AND sender_type = :stype"),
            {"cid": conversation_id, "stype": opposite}
        )
        await db.commit()


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    print("🔌 New WebSocket connection")

    conversation_id: Optional[str] = None
    user_id: Optional[str] = None
    is_admin: bool = False

    try:
        while True:
            data = await ws.receive_text()
            try:
                message = json.loads(data)
                msg_type = message.get("type")
                print(f"📨 Received message: {msg_type}")

                if msg_type == "join":
                    conversation_id = message.get("conversationId")
                    user_id = message.get("userId")
                    is_admin = message.get("isAdmin", False)

                    # Register connection
                    if conversation_id not in connections:
                        connections[conversation_id] = set()
                    connections[conversation_id].add(ws)

                    if user_id and not is_admin:
                        if user_id not in user_connections:
                            user_connections[user_id] = set()
                        user_connections[user_id].add(ws)

                    # Send history
                    history = await get_messages(conversation_id)
                    await ws.send_text(json.dumps({"type": "history", "messages": history}))

                    # Mark as read
                    await mark_messages_as_read(conversation_id, "admin" if is_admin else "user")

                elif msg_type == "message":
                    if not conversation_id:
                        await ws.send_text(json.dumps({"type": "error", "message": "Not joined to a conversation"}))
                        continue

                    new_msg = await add_message(
                        conversation_id=conversation_id,
                        sender_type="admin" if is_admin else "user",
                        sender_id=user_id,
                        sender_name=message.get("senderName", "Admin" if is_admin else "User"),
                        message=message.get("text", ""),
                        attachments=message.get("attachments", []),
                    )

                    # Broadcast to all in conversation
                    payload = json.dumps({"type": "new_message", "message": new_msg})
                    for client in list(connections.get(conversation_id, set())):
                        try:
                            await client.send_text(payload)
                        except Exception:
                            pass

                    await mark_messages_as_read(conversation_id, "admin" if is_admin else "user")

                    # Notify user if admin sent message
                    if is_admin and user_id:
                        for client in list(user_connections.get(user_id, set())):
                            if client is not ws:
                                try:
                                    await client.send_text(payload)
                                except Exception:
                                    pass

                elif msg_type == "typing":
                    if conversation_id:
                        payload = json.dumps({
                            "type": "typing",
                            "isTyping": message.get("isTyping"),
                            "senderName": message.get("senderName"),
                        })
                        for client in list(connections.get(conversation_id, set())):
                            if client is not ws:
                                try:
                                    await client.send_text(payload)
                                except Exception:
                                    pass

                elif msg_type == "read":
                    if conversation_id:
                        await mark_messages_as_read(conversation_id, "admin" if is_admin else "user")

            except json.JSONDecodeError:
                await ws.send_text(json.dumps({"type": "error", "message": "Invalid JSON"}))
            except Exception as e:
                print(f"❌ Error handling message: {e}")
                await ws.send_text(json.dumps({"type": "error", "message": str(e)}))

    except WebSocketDisconnect:
        print("🔌 WebSocket connection closed")
    finally:
        # Cleanup connections
        if conversation_id and conversation_id in connections:
            connections[conversation_id].discard(ws)
            if not connections[conversation_id]:
                del connections[conversation_id]

        if user_id and user_id in user_connections:
            user_connections[user_id].discard(ws)
            if not user_connections[user_id]:
                del user_connections[user_id]


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print(f"✅ WebSocket server starting on port {WS_PORT}")
    uvicorn.run(app, host="0.0.0.0", port=WS_PORT)


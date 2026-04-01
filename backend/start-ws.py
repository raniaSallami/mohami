#!/usr/bin/env python3
"""
Start Mouhami WebSocket Server (FastAPI)
Equivalent of server/start-ws.cjs
"""
import os
import sys
import uvicorn

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

if __name__ == "__main__":
    port = int(os.getenv("WS_PORT", "8082"))
    print(f"🚀 Starting Mouhami WebSocket Server on port {port}...")
    print("📡 WebSocket endpoint: ws://localhost:8082/ws")
    uvicorn.run(
        "websocket_server:app",
        host="0.0.0.0",
        port=port,
        reload=os.getenv("DEBUG", "0") == "1",
        log_level="info"
    )


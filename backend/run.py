"""
Application runner for the FastAPI backend.
Launches both the FastAPI server and the email worker simultaneously.
"""
import uvicorn
import asyncio
import subprocess
import sys
import os
import time
import logging
import socket

# Force IPv4 for local resolution to avoid gaierror [Errno 11001] on Windows
original_getaddrinfo = socket.getaddrinfo

def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    # Force use of AF_INET (IPv4) instead of AF_UNSPEC (which might try IPv6 first)
    return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

socket.getaddrinfo = patched_getaddrinfo

from app.config import settings

# Configure logging to suppress noisy libraries
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def start_email_worker():
    """Lance email_worker.py en processus parallèle."""
    worker_path = os.path.join(os.path.dirname(__file__), "email_worker.py")
    
    try:
        if sys.platform == "win32":
            # Windows: launch in new console
            subprocess.Popen(
                [sys.executable, worker_path],
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            # Unix: launch in background
            subprocess.Popen([sys.executable, worker_path])
        
        print("[SUCCESS] Email worker lancé automatiquement en arrière-plan")
        time.sleep(1)  # Give worker time to start
    except Exception as e:
        print(f"[WARNING] Erreur lors du lancement du worker email: {e}")
        print("[WARNING] Les emails ne seront pas envoyés. Vérifiez les logs.")


if __name__ == "__main__":
    print("=" * 60)
    print("[STARTING] Backend Mouhami...")
    print("=" * 60)
    
    # Lance le worker email en arrière-plan
    start_email_worker()

    # Lance le serveur FastAPI
    print(f"[API] FastAPI server sur http://{settings.api_host}:{settings.api_port}")
    print("=" * 60)
    
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="warning"
    )
"""
FastAPI application entry point.
Mouhami AI - Legal Case Management Backend
"""
import sys
import asyncio
import socket

# Force IPv4 for local resolution to avoid gaierror [Errno 11001] on Windows
original_getaddrinfo = socket.getaddrinfo

def patched_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    return original_getaddrinfo(host, port, socket.AF_INET, type, proto, flags)

socket.getaddrinfo = patched_getaddrinfo

if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import smtplib
import re
import os
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
from sqlalchemy import text, select

from app.config import settings

# Ensure uploads directory exists (required for StaticFiles mounting below)
os.makedirs("uploads", exist_ok=True)

# Suppress verbose logging from third-party libraries
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.dialects").setLevel(logging.WARNING)
from app.database import init_db, close_db, AsyncSessionLocal
from app.routers import auth, users, cases, contracts, events, invoices, notifications, chat, admin
from app.routers import password_reset, device_security, admin_security, subscriptions
from app.routers import automated_subscription
from app.routers import settings as settings_router


# ═══════════════════════════════════════════════════════════
# EMBEDDED EMAIL WORKER (runs as background task)
# ═══════════════════════════════════════════════════════════

SMTP_HOST = settings.smtp_host
SMTP_PORT = settings.smtp_port
SMTP_USER = settings.smtp_user
SMTP_PASSWORD = settings.smtp_password
MAIL_FROM_ADDRESS = settings.mail_from_address or SMTP_USER
MAIL_FROM_NAME = settings.mail_from_name


def _send_email_smtp(to_email: str, subject: str, html_content: str, text_content: str = "") -> str:
    """Send a single email via SMTP."""
    if not SMTP_USER or not SMTP_PASSWORD:
        raise Exception("SMTP credentials not configured")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f'"{MAIL_FROM_NAME}" <{MAIL_FROM_ADDRESS}>'
    msg["To"] = to_email

    plain = text_content or re.sub(r'<[^>]+>', '', html_content)
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM_ADDRESS, to_email, msg.as_string())

    return "sent"


async def _process_email_queue():
    """Process pending emails from the email_queue table."""
    try:
        async with AsyncSessionLocal() as db:
            try:
                # Wrap SELECT with timeout to fail fast on DB unavailability
                result = await asyncio.wait_for(
                    db.execute(
                        text("SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10")
                    ),
                    timeout=10
                )
                emails = result.mappings().all()
            except asyncio.TimeoutError:
                print("⏱️  Email worker: Database queue SELECT timeout (DB unavailable)")
                raise

            if not emails:
                # Still commit to close the implicit transaction and avoid ROLLBACK logs
                await db.commit()
                return

            print(f"📧 Email worker: Found {len(emails)} pending email(s)")

            for email in emails:
                try:
                    print(f"📤 Sending to: {email['to_email']} | Subject: {email['subject']}")

                    _send_email_smtp(
                        to_email=email["to_email"],
                        subject=email["subject"],
                        html_content=email["html_content"] or "",
                        text_content=email.get("text_content") or "",
                    )

                    print(f"✅ Sent to {email['to_email']}")

                    await db.execute(
                        text("UPDATE email_queue SET status = 'sent', sent_at = :sent_at WHERE id = :id"),
                        {"sent_at": datetime.now(), "id": email["id"]},
                    )

                except Exception as e:
                    print(f"❌ Failed to send to {email['to_email']}: {e}")
                    await db.execute(
                        text("UPDATE email_queue SET status = 'failed', error_message = :err WHERE id = :id"),
                        {"err": f"{e}"[:500], "id": email["id"]},

                    )

            await db.commit()

    except asyncio.TimeoutError:
        print("⏱️  Email worker: Queue processing timeout")
        raise

    except Exception as e:
        import traceback
        error_type = type(e).__name__
        error_msg = str(e)[:150]
        print(f"❌ Email worker error: {error_type}: {error_msg}")
        if settings.debug:
            traceback.print_exc()


def _verify_smtp_connection() -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("⚠️  SMTP credentials not set — emails will NOT be sent")
        return False

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
        print("✅ SMTP connection verified")
        return True
    except Exception as e:
        print(f"⚠️  SMTP verification failed: {e}")
        return False


async def _email_worker_loop():
    """Background loop that processes email queue every 15 seconds."""
    print("📧 Email worker started (embedded) — processing queue every 15 seconds")

    smtp_ready = _verify_smtp_connection()
    if not smtp_ready:
        print("⚠️  Email worker disabled until SMTP configuration is fixed.")

    consecutive_errors = 0
    max_consecutive_errors = 3
    base_interval = 15
    
    while True:
        try:
            if smtp_ready:
                # Wrap with timeout to prevent infinite waits
                await asyncio.wait_for(_process_email_queue(), timeout=25)
                consecutive_errors = 0  # Reset on success
            else:
                await asyncio.sleep(60)
                smtp_ready = _verify_smtp_connection()
                continue

        except asyncio.TimeoutError:
            consecutive_errors += 1
            backoff_interval = min(base_interval + (consecutive_errors * 10), 120)
            print(f"⏱️  Email worker: Queue timeout ({consecutive_errors}/{max_consecutive_errors}). Waiting {backoff_interval}s...")
            await asyncio.sleep(backoff_interval)
            continue

        except asyncio.CancelledError:
            print("📧 Email worker stopping...")
            break

        except Exception as e:
            consecutive_errors += 1
            error_type = type(e).__name__
            backoff_interval = min(base_interval + (consecutive_errors * 10), 120)
            print(f"❌ Email worker loop error ({consecutive_errors}/{max_consecutive_errors}): {error_type}")
            
            if consecutive_errors >= max_consecutive_errors:
                print(f"⚠️  Max consecutive errors. Waiting {backoff_interval}s before retry...")
            
            await asyncio.sleep(backoff_interval)
            continue
        
        # Normal interval between successful attempts
        await asyncio.sleep(base_interval)


# ═══════════════════════════════════════════════════
# ENSURE RAW SQL TABLES EXIST
# ═══════════════════════════════════════════════════════════

async def _create_raw_tables():
    """Create tables that are used via raw SQL (not SQLAlchemy models)."""
    async with AsyncSessionLocal() as db:
        try:
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS email_queue (
                    id VARCHAR(255) PRIMARY KEY,
                    to_email VARCHAR(255) NOT NULL,
                    subject VARCHAR(500),
                    html_content TEXT,
                    text_content TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    error_message TEXT,
                    sent_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            
            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS security_logs (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(36),
                    ip_address VARCHAR(100),
                    event_type VARCHAR(100) NOT NULL,
                    details TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))

            await db.execute(text("""
                CREATE TABLE IF NOT EXISTS refresh_tokens (
                    id SERIAL PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    token TEXT NOT NULL,
                    device_name VARCHAR(255),
                    ip_address VARCHAR(100),
                    is_revoked BOOLEAN DEFAULT FALSE,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """))
            
            # ═══════════════════════════════════════════════════════════
            # PROACTIVE SCHEMA SYNC: Add missing columns to existing tables
            # ═══════════════════════════════════════════════════════════
            sync_statements = [
                # Cases column fixes
                "ALTER TABLE cases ADD COLUMN IF NOT EXISTS date_updated TIMESTAMP DEFAULT NOW()",
                
                # Contracts column fixes
                "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS date_updated TIMESTAMP DEFAULT NOW()",
                
                # Invoices column fixes
                "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
                "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()",
                
                # Chat & Messaging column fixes
                "ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
                "ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()",
                "ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
                "ALTER TABLE team_chat_messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
                
                # Notifications fixes
                "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()",
                
                # Tenant/Multi-organization fixes
                "ALTER TABLE events ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36)",
                "ALTER TABLE contracts ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36)",
                "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36)"
            ]
            
            for stmt in sync_statements:
                try:
                    await db.execute(text(stmt))
                except Exception as e:
                    # Silently ignore if column already exists or other non-critical issues
                    if settings.debug:
                        print(f"DEBUG: Schema sync skip: {stmt} | Reason: {e}")
            
            await db.commit()
            print("✅ Database schema synchronized (Raw SQL & Alterations)")
        except Exception as e:
            print(f"⚠️  Raw tables creation note: {e}")
            await db.rollback()

async def _db_keepalive_loop():
    """Keep the Neon connection active by running a lightweight query periodically."""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("SELECT 1"))
                if settings.debug:
                    print("🟢 Database keepalive query succeeded")
        except Exception as e:
            print(f"⚠️  Database keepalive failed: {type(e).__name__}: {e}")
        await asyncio.sleep(4 * 60)

# ═══════════════════════════════════════════════════════════
# APPLICATION LIFESPAN
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    import asyncio
    
    print("Starting Mouhami API...")
    
    db_initialized = False
    max_retries = 1  # Only 1 quick attempt
    retry_delay = 2  # Very short delay
    
    # Try to initialize database (don't block startup if pooler is down)
    for attempt in range(1, max_retries + 1):
        try:
            print(f"🔄 Database init attempt {attempt}/{max_retries}...")
            await asyncio.wait_for(init_db(), timeout=25)  # Give Neon up to 25s to wake up
            print("✅ Database initialized successfully")
            db_initialized = True
            break
        except asyncio.TimeoutError:
            print(f"⏱️  Database connection timeout (Neon pooler unreachable)")
            if attempt < max_retries:
                print(f"   Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
        except Exception as e:
            error_str = str(e)[:100]
            print(f"❌ Database init error: {type(e).__name__}: {error_str}")
            if attempt < max_retries:
                print(f"   Retrying in {retry_delay}s...")
                await asyncio.sleep(retry_delay)
    
    if not db_initialized:
        print("⚠️  DATABASE NOT INITIALIZED")
        print("   API starting in DEGRADED MODE")
        print("   - Database queries will fail until connection restored")
        print("   - Check Neon status: https://status.neon.tech/")
        print()

    # Create raw SQL tables only if DB is ready
    if db_initialized:
        try:
            await _create_raw_tables()
        except Exception as e:
            print(f"⚠️  Raw tables creation failed: {e}")

    keepalive_task = asyncio.create_task(_db_keepalive_loop())

    # Start email worker as background task
    email_task = asyncio.create_task(_email_worker_loop())

    yield

    # Shutdown
    print("Shutting down Mouhami API...")
    email_task.cancel()
    try:
        await email_task
    except asyncio.CancelledError:
        pass

    if keepalive_task is not None:
        keepalive_task.cancel()
        try:
            await keepalive_task
        except asyncio.CancelledError:
            pass

    await close_db()
    print("Database connections closed")


# Create FastAPI application
app = FastAPI(
    title="Mouhami AI API",
    description="Legal Case Management Platform API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Unhandled exception: {exc}")
    
    # Check if request has Origin header for CORS
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in settings.cors_origins_list or "*" in settings.cors_origins_list):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}"},
        headers=headers
    )

@app.exception_handler(asyncio.TimeoutError)
async def timeout_exception_handler(request: Request, exc: asyncio.TimeoutError):
    print(f"Timeout exception: {exc}")
    
    # Check if request has Origin header for CORS
    origin = request.headers.get("origin")
    headers = {}
    if origin and (origin in settings.cors_origins_list or "*" in settings.cors_origins_list):
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        
    return JSONResponse(
        status_code=503,
        content={"detail": "Service Unavailable - Database connection timed out. Please check your network connection or VPN."},
        headers=headers
    )

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

# Include routers
from fastapi.staticfiles import StaticFiles
from app.routers import (
    auth, password_reset, device_security, admin_security,
    users, cases, contracts, events, invoices,
    notifications, chat, admin, settings as settings_router, gemini, faculties,
    analytics
)

# Static files for uploads
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

# ... inside include routers section ...
app.include_router(auth.router, prefix="/api")
app.include_router(password_reset.router, prefix="/api")
app.include_router(device_security.router, prefix="/api")
app.include_router(admin_security.router, prefix="/api")
app.include_router(faculties.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(subscriptions.router, prefix="/api")
app.include_router(automated_subscription.router, prefix="/api")
app.include_router(gemini.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "mouhami-api"}


@app.get("/api/health/db")
async def db_health_check():
    """Check if database is accessible."""
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        return {"status": "connected", "database": "postgres"}
    except Exception as e:
        return {
            "status": "disconnected",
            "database": "postgres",
            "error": type(e).__name__,
            "message": "Cannot reach database - Neon pooler may be offline"
        }


@app.get("/")
async def root():
    return {
        "message": "Welcome to Mouhami AI API",
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
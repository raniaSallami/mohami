"""
FastAPI application entry point.
Mouhami AI - Legal Case Management Backend
"""
import sys
import asyncio

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

# Suppress verbose logging from third-party libraries
logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.pool").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.dialects").setLevel(logging.WARNING)
from app.database import init_db, close_db, AsyncSessionLocal
from app.routers import auth, users, cases, contracts, events, invoices, notifications, chat, admin
from app.routers import password_reset, device_security, admin_security, signup_otp
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
            result = await db.execute(
                text("SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10")
            )
            emails = result.mappings().all()

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

    except Exception as e:
        print(f"❌ Email worker error: {e}")


async def _email_worker_loop():
    """Background loop that processes email queue every 15 seconds."""
    print("📧 Email worker started (embedded) — processing queue every 15 seconds")
    
    # Verify SMTP on startup
    if SMTP_USER and SMTP_PASSWORD:
        try:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
            print("✅ SMTP connection verified")
        except Exception as e:
            print(f"⚠️  SMTP verification failed: {e}")
    else:
        print("⚠️  SMTP credentials not set — emails will NOT be sent")

    while True:
        try:
            await _process_email_queue()
        except asyncio.CancelledError:
            print("📧 Email worker stopping...")
            break
        except Exception as e:
            print(f"❌ Email worker loop error: {e}")
        await asyncio.sleep(15)


# ═══════════════════════════════════════════════════════════
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
            
            # Add tenant_id column to events if it doesn't exist
            await db.execute(text("""
                ALTER TABLE events ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(36)
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

            # Fix cases table missing date_updated
            try:
                await db.execute(text("ALTER TABLE cases ADD COLUMN IF NOT EXISTS date_updated TIMESTAMP DEFAULT NOW()"))
                print("✅ Altered cases table: added date_updated column")
            except Exception as e:
                print(f"⚠️  Note on altering cases table: {e}")

            await db.commit()
            print("✅ Raw SQL tables verified/created")
        except Exception as e:
            print(f"⚠️  Raw tables creation note: {e}")
            await db.rollback()


# ═══════════════════════════════════════════════════════════
# APPLICATION LIFESPAN
# ═══════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    print("Starting Mouhami API...")
    try:
        await init_db()
        print("Database initialized")
    except Exception as e:
        print(f"Database initialization warning: {e}")

    # Create raw SQL tables
    try:
        await _create_raw_tables()
    except Exception as e:
        print(f"Raw tables warning: {e}")

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
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Include routers
from app.routers import (
    auth, password_reset, device_security, admin_security,
    users, cases, contracts, events, invoices,
    notifications, chat, admin, settings as settings_router, signup_otp, gemini
)

# ... inside include routers section ...
app.include_router(auth.router, prefix="/api")
app.include_router(password_reset.router, prefix="/api")
app.include_router(device_security.router, prefix="/api")
app.include_router(admin_security.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(contracts.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(invoices.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")
app.include_router(signup_otp.router, prefix="/api")
app.include_router(gemini.router, prefix="/api")


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "mouhami-api"}


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
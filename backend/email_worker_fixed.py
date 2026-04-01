"""
Email Worker Service - Fixed DB Connection
"""
import asyncio
import smtplib
import os
import sys
import re
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from dotenv import load_dotenv

# Load .env
_backend_env = os.path.join(os.path.dirname(__file__), ".env")
_parent_env  = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(_backend_env):
    load_dotenv(dotenv_path=_backend_env)
else:
    load_dotenv(dotenv_path=_parent_env)

# SMTP config
SMTP_HOST         = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT         = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER         = os.getenv("SMTP_USER")
SMTP_PASSWORD     = os.getenv("SMTP_PASSWORD")
MAIL_FROM_ADDRESS = os.getenv("MAIL_FROM_ADDRESS") or SMTP_USER
MAIL_FROM_NAME    = os.getenv("MAIL_FROM_NAME", "Mouhami AI")

print("📧 SMTP Configuration:")
print(f"  Host: {SMTP_HOST} | Port: {SMTP_PORT}")
print(f"  User: {SMTP_USER or 'NOT SET ❌'}")
print(f"  From: {MAIL_FROM_ADDRESS or 'NOT SET ❌'}")

if not SMTP_USER or not SMTP_PASSWORD:
    print("❌ SMTP_USER or SMTP_PASSWORD missing - emails DISABLED")
    sys.exit(1)

# Database
sys.path.insert(0, os.path.dirname(__file__))
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL", "")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Clean SSL params for local
DATABASE_URL_CLEAN = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', DATABASE_URL).rstrip('?&')

if not DATABASE_URL_CLEAN:
    print("❌ DATABASE_URL missing")
    sys.exit(1)

print(f"🔗 DB URL: {DATABASE_URL_CLEAN}")

engine = create_async_engine(
    DATABASE_URL_CLEAN,
    echo=False,
    connect_args={
        "ssl": False,  # Disable SSL for local PG
        "timeout": 60,
        "command_timeout": 60
    },
    pool_timeout=60,
    pool_recycle=300,
    pool_pre_ping=True,
    max_overflow=10,
    execution_options={"prepared_statement_cache_size": 0}
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

def verify_smtp():
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
        print("✅ SMTP Ready")
        return True
    except Exception as e:
        print(f"❌ SMTP Error: {e}")
        return False

def send_email(to_email, subject, html_content, text_content=""):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f'"{MAIL_FROM_NAME}" <{MAIL_FROM_ADDRESS}>'
    msg["To"] = to_email

    plain = text_content or re.sub(r'<[^>]+>', '', html_content)
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=60) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(MAIL_FROM_ADDRESS, to_email, msg.as_string())
    return "sent"

async def process_email_queue():
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5")
            )
            emails = result.mappings().all()
            
            print(f"📧 Queue: {len(emails)} pending")

            for email in emails:
                try:
                    print(f"📤 {email['to_email']} - {email['subject'][:50]}...")
                    
                    send_email(
                        email["to_email"],
                        email["subject"],
                        email["html_content"] or "",
                        email.get("text_content", "")
                    )
                    
                    print(f"✅ Sent to {email['to_email']}")
                    
                    await db.execute(
                        text("UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = :id"),
                        {"id": email["id"]}
                    )
                    
                except Exception as e:
                    print(f"❌ Failed {email['to_email']}: {e}")
                    await db.execute(
                        text("UPDATE email_queue SET status = 'failed', error_message = :err WHERE id = :id"),
                        {"err": str(e)[:100], "id": email["id"]}
                    )
            
            await db.commit()
            
    except Exception as e:
        print(f"❌ Queue error: {e}")
        import traceback
        traceback.print_exc()

async def main():
    print("🚀 Email Worker Started - Polling every 30s")
    verify_smtp()
    
    while True:
        try:
            await process_email_queue()
        except KeyboardInterrupt:
            break
        await asyncio.sleep(30)
    
    print("🛑 Stopped")

if __name__ == "__main__":
    asyncio.run(main())

"""
Email Worker - With proper .env loading
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

# Load .env from parent directory explicitly
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parent_env_path = os.path.join(parent_dir, '.env')
print(f"🔍 Loading .env from: {parent_env_path}")
print(f"   Exists: {os.path.exists(parent_env_path)}")

load_dotenv(dotenv_path=parent_env_path, override=True)

# SMTP config
SMTP_HOST         = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT         = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER         = os.getenv("SMTP_USER")
SMTP_PASSWORD     = os.getenv("SMTP_PASSWORD")
MAIL_FROM_ADDRESS = os.getenv("MAIL_FROM_ADDRESS") or SMTP_USER
MAIL_FROM_NAME    = os.getenv("MAIL_FROM_NAME", "Mouhami AI")

print("\n📧 SMTP Configuration:")
print(f"  Host: {SMTP_HOST} | Port: {SMTP_PORT}")
print(f"  User: {SMTP_USER or 'NOT SET ❌'}")
print(f"  Password: {'***' + SMTP_PASSWORD[-3:] if SMTP_PASSWORD else 'NOT SET ❌'}")
print(f"  From: {MAIL_FROM_ADDRESS or 'NOT SET ❌'}")

if not SMTP_USER or not SMTP_PASSWORD:
    print("\n❌ SMTP_USER or SMTP_PASSWORD missing - emails DISABLED")
    sys.exit(1)

print("✅ SMTP credentials loaded successfully\n")

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

DATABASE_URL_CLEAN = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', DATABASE_URL).rstrip('?&')

if not DATABASE_URL_CLEAN:
    print("❌ DATABASE_URL not set!")
    sys.exit(1)

engine = create_async_engine(
    DATABASE_URL_CLEAN,
    echo=False,
    connect_args={
        "ssl": "prefer",
        "timeout": 60,
        "command_timeout": 60
    },
    pool_timeout=60,
    pool_recycle=300,
    execution_options={
        "prepared_statement_cache_size": 0
    }
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# SMTP helpers
def verify_smtp() -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("❌ SMTP credentials missing")
        return False
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
        print("✅ SMTP Server connection verified")
        return True
    except Exception as e:
        print(f"❌ SMTP Connection Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def send_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> str:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise Exception("SMTP credentials not configured")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f'"{MAIL_FROM_NAME}" <{MAIL_FROM_ADDRESS}>'
    msg["To"]      = to_email

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


# Queue processor
async def process_email_queue():
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 5")
            )
            emails = result.mappings().all()

            if not emails:
                return

            print(f"📧 Found {len(emails)} pending email(s) to process")

            for email in emails:
                try:
                    print(f"📤 Sending to: {email['to_email']} | Subject: {email['subject'][:50]}")

                    send_email(
                        to_email=email["to_email"],
                        subject=email["subject"],
                        html_content=email["html_content"] or "",
                        text_content=email.get("text_content") or "",
                    )

                    print(f"✅ Email sent successfully to {email['to_email']}")

                    await db.execute(
                        text("UPDATE email_queue SET status = 'sent', sent_at = NOW() WHERE id = :id"),
                        {"id": email["id"]},
                    )

                except Exception as e:
                    print(f"❌ Failed to send to {email['to_email']}: {e}")
                    await db.execute(
                        text("UPDATE email_queue SET status = 'failed', error_message = :err WHERE id = :id"),
                        {"err": str(e)[:200], "id": email["id"]},
                    )

            await db.commit()

    except Exception as e:
        print(f"❌ Error processing email queue: {e}")
        import traceback
        traceback.print_exc()


# Main loop
async def main():
    print("🚀 Email Worker Started - Processing queue every 30 seconds")
    print("=" * 60)
    
    if not verify_smtp():
        print("\n⚠️  SMTP verification failed, but continuing anyway...\n")
    
    iteration = 0
    while True:
        iteration += 1
        print(f"\n[{iteration}] Checking queue at {datetime.utcnow().strftime('%H:%M:%S UTC')}")
        await process_email_queue()
        print(f"    Waiting 30 seconds...")
        await asyncio.sleep(30)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Email worker stopped by user.")
    except Exception as e:
        print(f"\n❌ Email worker crashed: {e}")
        import traceback
        traceback.print_exc()

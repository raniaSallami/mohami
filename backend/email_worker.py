"""
Email Worker Service
Reads from email_queue table and sends emails via SMTP every 30 seconds.
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

# Load .env from backend/ directory first, then parent
_backend_env = os.path.join(os.path.dirname(__file__), ".env")
_parent_env  = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(_backend_env):
    load_dotenv(dotenv_path=_backend_env)
else:
    load_dotenv(dotenv_path=_parent_env)

# ── SMTP config ──────────────────────────────────────────────────────────────
SMTP_HOST         = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT         = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER         = os.getenv("SMTP_USER")
SMTP_PASSWORD     = os.getenv("SMTP_PASSWORD")
MAIL_FROM_ADDRESS = os.getenv("MAIL_FROM_ADDRESS") or SMTP_USER  # fallback to SMTP_USER
MAIL_FROM_NAME    = os.getenv("MAIL_FROM_NAME", "Mouhami AI")

print("📧 SMTP Configuration:")
print(f"  Host: {SMTP_HOST}")
print(f"  Port: {SMTP_PORT}")
print(f"  User: {SMTP_USER or 'NOT SET ❌'}")
print(f"  From Address: {MAIL_FROM_ADDRESS or 'NOT SET ❌'}")
print(f"  From Name: {MAIL_FROM_NAME}")

if not SMTP_USER or not SMTP_PASSWORD:
    print("❌ SMTP_USER or SMTP_PASSWORD not set in .env — emails will NOT be sent!")

# ── Database ──────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

DATABASE_URL = os.getenv("DATABASE_URL", "")

def clean_database_url(url: str) -> str:
    """Normalize the database URL for SQLAlchemy + asyncpg."""
    if not url:
        return url
    parsed = urlparse(url)
    scheme = parsed.scheme
    if scheme in ("postgres", "postgresql", "postgresql+psycopg"):
        scheme = "postgresql+asyncpg"
    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in {"sslmode", "channel_binding"}
    ]
    query_string = urlencode(query, doseq=True)
    return urlunparse(parsed._replace(scheme=scheme, query=query_string))

DATABASE_URL = clean_database_url(DATABASE_URL)

if not DATABASE_URL:
    print("❌ DATABASE_URL not set in .env!")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=False,
    pool_size=1,
    max_overflow=1,
    connect_args={
        "ssl": "prefer",
        "timeout": 20,
        "command_timeout": 30,
    },
    pool_timeout=30,
    pool_recycle=300,
    pool_reset_on_return="none",
)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


# ── SMTP helpers ───────────────────────────────────────────────────────────────
def verify_smtp() -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        print("❌ SMTP credentials missing — skipping verification")
        return False
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
        print("✅ SMTP Server Ready")
        return True
    except Exception as e:
        print(f"❌ SMTP Connection Error: {e}")
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


# ── Queue processor ────────────────────────────────────────────────────────────
async def process_email_queue():
    try:
        async with AsyncSessionLocal() as db:
            try:
                # Wrap SELECT with timeout to fail fast
                result = await asyncio.wait_for(
                    db.execute(
                        text("SELECT * FROM email_queue WHERE status = 'pending' ORDER BY created_at ASC LIMIT 10")
                    ),
                    timeout=15
                )
                emails = result.mappings().all()
            except asyncio.TimeoutError:
                print("⏱️ Timeout fetching email queue from database")
                raise
            except Exception as e:
                print(f"❌ Database query error: {e}")
                raise

            if not emails:
                return

            print(f"📧 Found {len(emails)} pending email(s)")

            for email in emails:
                try:
                    print(f"📤 Sending to: {email['to_email']} | Subject: {email['subject']}")

                    send_email(
                        to_email=email["to_email"],
                        subject=email["subject"],
                        html_content=email["html_content"] or "",
                        text_content=email.get("text_content") or "",
                    )

                    print(f"✅ Sent to {email['to_email']}")

                    await db.execute(
                        text("UPDATE email_queue SET status = 'sent', sent_at = :sent_at WHERE id = :id"),
                        {"sent_at": datetime.utcnow(), "id": email["id"]},
                    )

                except Exception as e:
                    print(f"❌ Failed to send to {email['to_email']}: {e}")
                    await db.execute(
                        text("UPDATE email_queue SET status = 'failed', error_message = :err WHERE id = :id"),
                        {"err": str(e), "id": email["id"]},
                    )

            await db.commit()

    except asyncio.TimeoutError:
        print("⏱️ Email queue processing timed out")
        raise

    except Exception as e:
        import traceback
        print(f"❌ Error processing email queue: {e}")
        traceback.print_exc()


# ── Main loop ──────────────────────────────────────────────────────────────────
async def main():
    print("✅ Email worker started — processing queue every 30 seconds")
    verify_smtp()

    consecutive_errors = 0
    max_consecutive_errors = 3

    while True:
        try:
            # Wrap process_email_queue with timeout to prevent infinite waits
            await asyncio.wait_for(process_email_queue(), timeout=25)
            consecutive_errors = 0  # Reset on success
            await asyncio.sleep(30)

        except asyncio.TimeoutError:
            consecutive_errors += 1
            wait_time = min(30 + (consecutive_errors * 10), 120)  # Cap at 2 minutes
            print(f"⏱️ Queue processing timeout ({consecutive_errors}/{max_consecutive_errors}). Retrying in {wait_time}s...")
            await asyncio.sleep(wait_time)

        except Exception as e:
            consecutive_errors += 1
            wait_time = min(30 + (consecutive_errors * 10), 120)
            print(f"❌ Queue processing error ({consecutive_errors}/{max_consecutive_errors}): {e}")
            
            if consecutive_errors >= max_consecutive_errors:
                print(f"⚠️ Max consecutive errors reached. Waiting {wait_time}s before retry...")
                # Try to close and reopen connection
                engine.dispose()
            
            await asyncio.sleep(wait_time)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("🛑 Email worker stopped.")
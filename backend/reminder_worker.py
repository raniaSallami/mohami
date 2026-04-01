"""
Reminder Worker - FastAPI equivalent of attendance-reminder.cjs
Checks for events in the next hour and sends reminder emails via email_queue.
Runs every 5 minutes.
"""
import asyncio
import os
import sys
import re
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load .env from project root (one level up from backend/)
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# ── Database ─────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = os.getenv("DATABASE_URL", "")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

DATABASE_URL = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', DATABASE_URL).rstrip('?&')

engine = create_async_engine(DATABASE_URL, echo=False, connect_args={"ssl": "require"})
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "Mouhami AI")


# ── Email template ────────────────────────────────────────────────────────────
def build_reminder_email(user_name: str, event_title: str, event_date: str, event_time: str) -> dict:
    subject = f"تذكير: موعد قادم خلال ساعة - {event_title}"
    html = f"""
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Tajawal',Arial,sans-serif;background-color:#f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);border:2px solid #f59e0b;">
        <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 30px;text-align:center;">
          <h1 style="color:#1e293b;margin:0;font-size:32px;font-weight:bold;">⏰ تذكير بالموعد</h1>
        </td></tr>
        <tr><td style="padding:40px 30px;">
          <p style="color:#334155;font-size:16px;line-height:1.8;margin:0 0 20px 0;">
            عزيزي/عزيزتي <strong>{user_name}</strong>,
          </p>
          <p style="color:#dc2626;font-size:18px;font-weight:bold;margin:0 0 20px 0;text-align:center;">
            ⚠️ لديك موعد خلال ساعة واحدة!
          </p>
          <div style="background-color:#fef3c7;border-right:4px solid #f59e0b;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="color:#1e293b;font-size:20px;font-weight:bold;margin:0 0 10px 0;">{event_title}</p>
            <p style="color:#64748b;font-size:16px;margin:5px 0;">📅 {event_date}</p>
            <p style="color:#64748b;font-size:16px;margin:5px 0;">🕐 {event_time}</p>
          </div>
          <p style="color:#334155;font-size:16px;line-height:1.8;margin:20px 0;">
            يرجى التأكد من الاستعداد للموعد.
          </p>
        </td></tr>
        <tr><td style="background-color:#1e293b;padding:30px;text-align:center;">
          <p style="color:#94a3b8;font-size:14px;margin:0;">منصة المحامي - Mouhami AI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
    """
    text = f"تذكير: لديك موعد خلال ساعة واحدة!\n{event_title}\nالتاريخ: {event_date}\nالوقت: {event_time}"
    return {"subject": subject, "html": html, "text": text}


# ── Queue email ───────────────────────────────────────────────────────────────
async def queue_email(db: AsyncSession, to_email: str, subject: str, html: str, text: str):
    import random, string
    email_id = f"reminder_{int(datetime.utcnow().timestamp() * 1000)}_{''.join(random.choices(string.ascii_lowercase + string.digits, k=9))}"
    await db.execute(
        text("""
            INSERT INTO email_queue (id, to_email, subject, html_content, text_content, status, created_at)
            VALUES (:id, :to, :subject, :html, :text, 'pending', :now)
        """),
        {
            "id": email_id,
            "to": to_email,
            "subject": subject,
            "html": html,
            "text": text,
            "now": datetime.utcnow(),
        }
    )


# ── Main checker ──────────────────────────────────────────────────────────────
async def check_attendance_reminders():
    print(f"🔍 Checking attendance reminders at {datetime.utcnow().strftime('%H:%M:%S')}")
    try:
        now = datetime.utcnow()
        one_hour_later = now + timedelta(hours=1)

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                text("""
                    SELECT e.*, u.email, u.name
                    FROM events e
                    JOIN users u ON e.user_id::text = u.id::text
                    WHERE e.date >= :now
                    AND e.date <= :one_hour_later
                    AND (e.reminder_sent IS NULL OR e.reminder_sent = FALSE)
                    AND e.time IS NOT NULL
                """),
                {"now": now.isoformat(), "one_hour_later": one_hour_later.isoformat()}
            )
            events = result.mappings().all()

            if not events:
                print("📅 No upcoming events needing reminders")
                return

            print(f"📅 Found {len(events)} event(s) to check")

            for event in events:
                try:
                    # Parse event datetime
                    event_time_str = event["time"]
                    hours, minutes = event_time_str.split(":")[:2]
                    event_date = event["date"]
                    if isinstance(event_date, str):
                        event_date = datetime.fromisoformat(event_date.replace("Z", ""))

                    event_datetime = event_date.replace(
                        hour=int(hours), minute=int(minutes), second=0, microsecond=0
                    )

                    time_diff = (event_datetime - now).total_seconds()
                    hours_until = time_diff / 3600

                    if 0 < hours_until <= 1:
                        # Build and queue reminder email
                        template = build_reminder_email(
                            user_name=event["name"],
                            event_title=event["title"],
                            event_date=event_date.strftime("%Y-%m-%d"),
                            event_time=event_time_str,
                        )

                        await queue_email(
                            db=db,
                            to_email=event["email"],
                            subject=template["subject"],
                            html=template["html"],
                            text=template["text"],
                        )

                        # Mark as reminded
                        await db.execute(
                            text("UPDATE events SET reminder_sent = TRUE WHERE id = :id"),
                            {"id": event["id"]}
                        )

                        print(f"✅ Reminder queued for: {event['title']} → {event['email']}")

                except Exception as e:
                    print(f"❌ Failed to process reminder for event {event['id']}: {e}")

            await db.commit()

    except Exception as e:
        print(f"❌ Error checking attendance reminders: {e}")


# ── Main loop ─────────────────────────────────────────────────────────────────
async def main():
    print("✅ Reminder worker started - checking every 5 minutes")
    while True:
        await check_attendance_reminders()
        await asyncio.sleep(5 * 60)  # every 5 minutes


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("🛑 Reminder worker stopped.")




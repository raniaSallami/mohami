"""Check email queue status."""
import asyncio, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

db_url = os.getenv("DATABASE_URL", "")
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
db_url = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', db_url).rstrip('?&')

engine = create_async_engine(db_url, connect_args={"ssl": True, "timeout": 60, "command_timeout": 60})
Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def main():
    async with Session() as s:
        r = await s.execute(text(
            "SELECT id, to_email, subject, status, created_at FROM email_queue ORDER BY created_at DESC LIMIT 5"
        ))
        rows = r.fetchall()
        if not rows:
            print("No emails in queue")
        for row in rows:
            print(f"ID: {row[0][:40]}")
            print(f"  To: {row[1]}")
            print(f"  Status: {row[3]}")
            print(f"  Created: {row[4]}")
            print()
    await engine.dispose()

asyncio.run(main())

import asyncio
import os
import sys
import re
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.getcwd(), "..", ".env"))

async def check_queue():
    url = os.getenv("DATABASE_URL", "")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', url).rstrip('?&')
    
    print(f"Checking queue at {url}")
    engine = create_async_engine(url, connect_args={"ssl": True})
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT id, to_email, status, created_at FROM email_queue WHERE status = 'pending'"))
            rows = result.fetchall()
            print(f"Found {len(rows)} pending emails:")
            for r in rows:
                print(f" - {r.id}: to {r.to_email} (Created: {r.created_at})")
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_queue())

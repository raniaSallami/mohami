import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import asyncio
from app.database import AsyncSessionLocal
from sqlalchemy import text

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id, to_email, subject, status, created_at FROM email_queue ORDER BY created_at DESC LIMIT 5")
        )
        emails = result.fetchall()
        print("Latest Emails in Queue:")
        for e in emails:
            print(f"- {e.id}: To: {e.to_email}, Status: {e.status}")

if __name__ == "__main__":
    asyncio.run(main())

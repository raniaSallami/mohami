import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.database import engine, init_db
from sqlalchemy import text

async def check_db():
    print("Checking database connection...")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"✅ Connection successful: {result.fetchone()}")
            return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(check_db())

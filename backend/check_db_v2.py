import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.config import settings
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import traceback

async def check_db():
    print(f"URL: {settings.database_url}")
    _db_url = settings.database_url
    if _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Remove sslmode from URL as asyncpg handles it differently
    _db_url = _db_url.replace("sslmode=require&", "").replace("sslmode=require", "").replace("&channel_binding=require", "").replace("channel_binding=require", "")
    
    print(f"Final Async URL: {_db_url}")
    
    engine = create_async_engine(
        _db_url,
        connect_args={
            "ssl": True,
            "timeout": 10
        }
    )
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"✅ SUCCESS: {result.fetchone()}")
    except Exception as e:
        print("❌ FAILED:")
        traceback.print_exc()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_db())

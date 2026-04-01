import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def test_conn():
    _db_url = settings.database_url
    if _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    _db_url = _db_url.replace("sslmode=require&", "").replace("sslmode=require", "").replace("&channel_binding=require", "").replace("channel_binding=require", "")
    
    print(f"Connecting to: {_db_url}")
    
    engine = create_async_engine(
        _db_url,
        echo=True,
        connect_args={"ssl": True, "timeout": 10}
    )
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"Result: {result.fetchone()}")
            print("Successfully connected to the database!")
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_conn())

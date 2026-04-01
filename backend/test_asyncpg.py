import asyncio
import asyncpg
from app.config import settings

async def test_asyncpg():
    _db_url = settings.database_url
    if _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    _db_url = _db_url.replace("sslmode=require&", "").replace("sslmode=require", "").replace("&channel_binding=require", "").replace("channel_binding=require", "")
    
    # Remove asyncpg prefix for direct asyncpg use
    url = settings.database_url.replace("postgresql://", "postgres://", 1)
    # Remove params as asyncpg likes its own way
    url = url.split("?")[0]
    
    print(f"Connecting with asyncpg to: {url}")
    
    try:
        conn = await asyncpg.connect(url, ssl=True, timeout=10)
        print("Connected with asyncpg!")
        res = await conn.fetchval("SELECT 1")
        print(f"Result: {res}")
        await conn.close()
    except Exception as e:
        print(f"asyncpg connection failed: {repr(e)}")

if __name__ == "__main__":
    asyncio.run(test_asyncpg())

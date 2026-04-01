import asyncio
import sys
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import socket
orig_getaddrinfo = socket.getaddrinfo
def patched_getaddrinfo(*args, **kwargs):
    res = orig_getaddrinfo(*args, **kwargs)
    return [r for r in res if r[0] == socket.AF_INET]
socket.getaddrinfo = patched_getaddrinfo

import traceback
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.config import settings

async def test_conn():
    _db_url = settings.database_url
    if _db_url.startswith("postgresql://"):
        _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    
    _db_url = _db_url.replace("sslmode=require&", "").replace("sslmode=require", "").replace("&channel_binding=require", "").replace("channel_binding=require", "")
    if "?" not in _db_url and "sslmode" not in _db_url:
        _db_url += "?sslmode=require"
    elif "sslmode" not in _db_url:
        _db_url += "&sslmode=require"
    
    # Trim trailing ?
    if _db_url.endswith("?"):
        _db_url = _db_url[:-1]
    
    print(f"Connecting to: {_db_url}")
    
    engine = create_async_engine(
        _db_url,
        echo=True,
        connect_args={"connect_timeout": 30}
    )
    
    try:
        print("Executing SELECT 1...")
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"Result: {result.fetchone()}")
            print("Successfully connected to the database!")
    except Exception as e:
        print(f"Connection failed: {repr(e)}")
        traceback.print_exc()
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_conn())

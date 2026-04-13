import asyncio
import asyncpg
import os
import sys
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    parsed = urlparse(DATABASE_URL)
    print("Testing with SelectorEventLoop instead of ProactorEventLoop...")
    try:
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,
                password=parsed.password,
                database=parsed.path.lstrip('/'),
                ssl=True,
                timeout=10
            ),
            timeout=15
        )
        val = await conn.fetchval("SELECT 1")
        print(f"✅ Success! Query result: {val}")
        await conn.close()
    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())

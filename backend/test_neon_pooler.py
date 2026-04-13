import asyncio
import asyncpg
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def test_endpoint(hostname):
    print(f"\nTesting hostname: {hostname}")
    parsed = urlparse(DATABASE_URL)
    
    try:
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host=hostname,
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
        print(f"✅ Success on {hostname}! Query result: {val}")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ Error on {hostname}: {type(e).__name__}: {e}")
        return False

async def main():
    parsed = urlparse(DATABASE_URL)
    host = parsed.hostname
    
    variants = [
        host,
        host.replace(".c-4.", "-pooler.c-4."),
        host.replace(".c-4.", "."),
        host.replace("ep-dry-cloud-airaa41g", "ep-dry-cloud-airaa41g-pooler")
    ]
    
    # ensure unique
    variants = list(dict.fromkeys(variants))
    
    for v in variants:
        success = await test_endpoint(v)
        if success:
            print(f"\n🚀 FOUND WORKING HOSTNAME: {v}")
            break

if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import asyncpg
import os

async def check():
    url = "postgresql://neondb_owner:npg_bvgKwtHJ72ln@ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech/test_bd"
    print(f"Connecting to {url}...")
    try:
        # Default asyncpg behavior should work with Neon if projects are in host
        conn = await asyncpg.connect(url, timeout=10)
        print("✅ SUCCESS!")
        await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())

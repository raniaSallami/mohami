#!/usr/bin/env python3
"""
Quick diagnostic to test Neon connection and identify exact error.
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not set in .env!")
    exit(1)

print(f"📍 DATABASE_URL: {DATABASE_URL}")

# Parse URL
parsed = urlparse(DATABASE_URL)
print(f"\n📊 Parsed URL:")
print(f"  - Scheme: {parsed.scheme}")
print(f"  - Hostname: {parsed.hostname}")
print(f"  - Port: {parsed.port}")
print(f"  - Database: {parsed.path.lstrip('/')}")
print(f"  - User: {parsed.username}")
print(f"  - Query params: {parsed.query}")

async def test_direct_connection():
    """Test raw asyncpg connection."""
    try:
        print(f"\n🔗 Testing direct asyncpg connection...")
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,
                password=parsed.password,
                database=parsed.path.lstrip('/'),
                ssl=True,  # Try with SSL
                timeout=10
            ),
            timeout=15
        )
        result = await conn.fetchval("SELECT 1")
        print(f"✅ Connection successful! Query result: {result}")
        await conn.close()
        return True
    except asyncpg.InvalidPasswordError as e:
        print(f"❌ Invalid credentials: {e}")
        return False
    except asyncpg.PostgresError as e:
        print(f"❌ PostgreSQL error: {e}")
        return False
    except asyncio.TimeoutError:
        print(f"⏱️ Connection timeout (database unreachable or too slow)")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {type(e).__name__}: {e}")
        return False


async def test_without_ssl():
    """Test without SSL enforcement."""
    try:
        print(f"\n🔗 Testing WITHOUT SSL enforcement...")
        conn = await asyncio.wait_for(
            asyncpg.connect(
                host=parsed.hostname,
                port=parsed.port or 5432,
                user=parsed.username,
                password=parsed.password,
                database=parsed.path.lstrip('/'),
                ssl=False,  # Try without SSL
                timeout=10
            ),
            timeout=15
        )
        result = await conn.fetchval("SELECT 1")
        print(f"✅ Connection successful WITHOUT SSL! Query result: {result}")
        await conn.close()
        return True
    except Exception as e:
        print(f"❌ Failed without SSL: {type(e).__name__}: {e}")
        return False


async def main():
    print("=" * 70)
    print("NEON CONNECTION DIAGNOSTIC")
    print("=" * 70)
    
    ssl_result = await test_direct_connection()
    if not ssl_result:
        print("\n⚠️  Trying alternative: connection without SSL...")
        no_ssl_result = await test_without_ssl()
        if no_ssl_result:
            print("\n💡 SOLUTION: Use 'ssl=False' in connection settings")


if __name__ == "__main__":
    asyncio.run(main())

import asyncio
import asyncpg
import socket
import os
import traceback
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    orig_getaddrinfo = socket.getaddrinfo
    def ipv6_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
        # Force AF_INET6
        return orig_getaddrinfo(host, port, socket.AF_INET6, type, proto, flags)
    
    socket.getaddrinfo = ipv6_getaddrinfo
    print("Patched socket.getaddrinfo to force IPv6")
    
    parsed = urlparse(DATABASE_URL)
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
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

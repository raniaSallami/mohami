import asyncio
import asyncpg
import os
import re
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.getcwd(), "..", ".env"))

async def check():
    url = os.getenv("DATABASE_URL", "")
    # asyncpg URL must NOT have query params like ?sslmode=...
    clean_url = re.sub(r'[?&](sslmode|channel_binding)=[^&]*', '', url).rstrip('?&')
    
    print(f"Direct asyncpg check at {clean_url}")
    try:
        conn = await asyncpg.connect(clean_url, ssl='require', timeout=10)
        row = await conn.fetchrow("SELECT COUNT(*) FROM email_queue WHERE status = 'pending'")
        print(f"✅ Success! Pending emails: {row[0]}")
        await conn.close()
    except Exception as e:
        print(f"❌ Error direct: {e}")

if __name__ == "__main__":
    asyncio.run(check())

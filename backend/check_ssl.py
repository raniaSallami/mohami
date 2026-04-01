import asyncio
import asyncpg
import ssl
import os
import re
import traceback

def log(m):
    with open("debug_db.log", "a") as f:
        f.write(str(m) + "\n")

async def check():
    url = "postgresql://neondb_owner:npg_bvgKwtHJ72ln@ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech/test_bd"
    log(f"Testing with SSL Context for {url}")
    
    # Create SSL Context
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # Temporairement pour débugger
    
    try:
        conn = await asyncio.wait_for(asyncpg.connect(url, ssl=ctx), timeout=15)
        log("✅ Connected with CERT_NONE!")
        await conn.close()
    except Exception as e:
        log("❌ Error with CERT_NONE:")
        log(traceback.format_exc())

if __name__ == "__main__":
    if os.path.exists("debug_db.log"): os.remove("debug_db.log")
    asyncio.run(check())
    log("Done.")

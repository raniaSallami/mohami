import asyncio
import asyncpg
import os
import re
import traceback

def log(m):
    with open("debug_db.log", "a") as f:
        f.write(str(m) + "\n")

async def check():
    url = "postgresql://neondb_owner:npg_bvgKwtHJ72ln@ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech/test_bd"
    log(f"Starting check for {url}")
    try:
        # Note: Neon pooler might need specific options. Try direct connection.
        # But wait, poolers often work better with asyncpg than direct if they handle pgbouncer-like pooling.
        conn = await asyncio.wait_for(asyncpg.connect(url, ssl='require'), timeout=10)
        log("✅ Connected!")
        row = await conn.fetchrow("SELECT COUNT(*) FROM email_queue")
        log(f"Row count: {row[0]}")
        await conn.close()
    except Exception as e:
        log("❌ Error:")
        log(traceback.format_exc())

if __name__ == "__main__":
    if os.path.exists("debug_db.log"): os.remove("debug_db.log")
    asyncio.run(check())
    log("Done.")

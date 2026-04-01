import asyncio
import asyncpg
import os
import re
import traceback

with open("debug_db.log", "w") as f:
    f.write("Starting DB check...\n")

    async def check():
        url = "postgresql://neondb_owner:npg_bvgKwtHJ72ln@ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech/test_bd"
        f.write(f"URL: {url}\n")
        try:
            conn = await asyncio.wait_for(asyncpg.connect(url, ssl='require'), timeout=10)
            f.write("✅ Connected!\n")
            row = await conn.fetchrow("SELECT COUNT(*) FROM email_queue")
            f.write(f"Row count: {row[0]}\n")
            await conn.close()
        except Exception:
            f.write("❌ Error:\n")
            f.write(traceback.format_exc())

    if __name__ == "__main__":
        asyncio.run(check())
        f.write("Done.\n")

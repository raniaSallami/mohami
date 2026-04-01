import asyncio
import asyncpg
import ssl
import os
import re

async def check():
    ip = "54.86.249.90"
    user = "neondb_owner"
    passw = "npg_bvgKwtHJ72ln"
    dbname = "test_bd"
    host = "ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech"
    
    print(f"Connecting to {ip} with SNI {host}...")
    ctx = ssl.create_default_context()
    # ctx.check_hostname = True (par défaut)
    
    try:
        conn = await asyncpg.connect(
            user=user, 
            password=passw, 
            database=dbname, 
            host=ip, # use IP for direct connection
            port=5432,
            ssl=ctx,
            server_hostname=host, # IMPORTANT for SNI over IP
            timeout=10
        )
        print("✅ SUCCESS over IPv4!")
        row = await conn.fetchrow("SELECT 1")
        print(f"SELECT 1: {row[0]}")
        await conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(check())

import asyncio
from sqlalchemy import text
from app.database import engine

async def reset_limits():
    async with engine.connect() as conn:
        result = await conn.execute(text('''
            DELETE FROM security_logs 
            WHERE event_type IN ('failed_login', 'blocked')
        '''))
        print(f"Reset {result.rowcount} rate limit entries")
        await conn.commit()

asyncio.run(reset_limits())


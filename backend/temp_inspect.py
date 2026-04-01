import os
import asyncio
import re
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from pathlib import Path
from dotenv import load_dotenv

parent = Path(__file__).resolve().parent.parent
load_dotenv(parent / '.env')
url = os.getenv('DATABASE_URL')
if url and url.startswith('postgresql://'):
    url = url.replace('postgresql://', 'postgresql+asyncpg://')
url = re.sub(r'\?.*$', '', url)

async def main():
    engine = create_async_engine(url, echo=False)
    async with engine.connect() as conn:
        r = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='security_logs'"))
        print('security_logs columns:', r.fetchall())
    await engine.dispose()

asyncio.run(main())
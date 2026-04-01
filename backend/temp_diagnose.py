import os,asyncio,re
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from pathlib import Path
from dotenv import load_dotenv

parent=Path(__file__).resolve().parent.parent
load_dotenv(parent/'.env')
url=os.getenv('DATABASE_URL')
if url and url.startswith('postgresql://'):
    url=url.replace('postgresql://','postgresql+asyncpg://')
url=re.sub(r'\?.*$','',url)

async def main():
    engine=create_async_engine(url,echo=True)
    async with engine.begin() as conn:
        print('start')
        await conn.execute(text('SELECT 1'))
        print('select ok')
        await conn.execute(text('CREATE TABLE IF NOT EXISTS security_logs (id VARCHAR(36) PRIMARY KEY, ip_address VARCHAR(100), user_id VARCHAR(36), event_type VARCHAR(50) NOT NULL, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'))
        print('table ok')
        await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs (event_type);'))
        print('index ok')
    await engine.dispose()

asyncio.run(main())
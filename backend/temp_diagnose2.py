import os,asyncio,re
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from pathlib import Path
from dotenv import load_dotenv

parent=Path(__file__).resolve().parent.parent
load_dotenv(parent/'.env')
url=os.getenv('DATABASE_URL')
if url and url.startswith('postgresql://'): url=url.replace('postgresql://','postgresql+asyncpg://')
url=re.sub(r'\?.*$','',url)

async def main():
    engine=create_async_engine(url,echo=False)
    async with engine.begin() as conn:
        try:
            print('table log start')
            await conn.execute(text('CREATE TABLE IF NOT EXISTS security_logs (id VARCHAR(36) PRIMARY KEY, ip_address VARCHAR(100), user_id VARCHAR(36), event_type VARCHAR(50) NOT NULL, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'))
            print('table log done')
            await conn.execute(text('ALTER TABLE security_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);'))
            print('alter user_id done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs (event_type);'))
            print('idx event done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs (ip_address);'))
            print('idx ip done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs (user_id);'))
            print('idx user_id done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs (created_at);'))
            print('idx created_at done')

            print('table refresh start')
            await conn.execute(text('CREATE TABLE IF NOT EXISTS refresh_tokens (id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE, token VARCHAR(500) NOT NULL, expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);'))
            print('table refresh done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);'))
            print('idx refresh user_id done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);'))
            print('idx refresh expires done')

            print('table email start')
            await conn.execute(text('CREATE TABLE IF NOT EXISTS email_queue (id VARCHAR(100) PRIMARY KEY, to_email VARCHAR(255) NOT NULL, subject VARCHAR(255) NOT NULL, html_content TEXT NOT NULL, text_content TEXT, status VARCHAR(50) DEFAULT \'pending\', retry_count INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, sent_at TIMESTAMP);'))
            print('table email done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue (status);'))
            print('idx email status done')
            await conn.execute(text('CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue (created_at);'))
            print('idx email created_done')

            await conn.execute(text('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;'))
            print('alter users done')
        except Exception as e:
            import traceback; traceback.print_exc()
            raise
    await engine.dispose()

asyncio.run(main())
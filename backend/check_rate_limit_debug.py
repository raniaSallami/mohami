import asyncio
from app.database import AsyncSessionLocal
from app.utils.rate_limiter import check_rate_limit

class DummyClient:
    host = '127.0.0.1'

class DummyRequest:
    client = DummyClient()
    headers = {}

async def main():
    async with AsyncSessionLocal() as db:
        try:
            await check_rate_limit(DummyRequest(), db, 'test@example.com')
            print('check_rate_limit ok')
        except Exception as e:
            print('check_rate_limit error', type(e), e)

if __name__ == '__main__':
    asyncio.run(main())
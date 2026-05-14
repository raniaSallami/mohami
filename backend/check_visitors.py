import asyncio
import sqlalchemy as sa
from app.database import engine
from app.models.tenant import PlatformVisitor

async def main():
    async with engine.begin() as conn:
        total = await conn.execute(sa.select(sa.func.count(PlatformVisitor.id)))
        unique = await conn.execute(sa.select(sa.func.count(sa.func.distinct(PlatformVisitor.session_id))))
        print('TOTAL', total.scalar())
        print('UNIQUE', unique.scalar())

asyncio.run(main())

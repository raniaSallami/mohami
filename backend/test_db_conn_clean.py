import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def test_conn():
    # Construct a clean URL without any query params
    clean_url = "postgresql+asyncpg://neondb_owner:npg_bvgKwtHJ72ln@ep-dry-cloud-airaa41g-pooler.c-4.us-east-1.aws.neon.tech/test_bd"
    
    print(f"Connecting to: {clean_url[:40]}...") # Redact part
    
    engine = create_async_engine(
        clean_url,
        echo=True,
        connect_args={"ssl": True, "timeout": 30}
    )
    
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            print(f"Result: {result.fetchone()}")
            print("Successfully connected to the database!")
    except Exception as e:
        print(f"Connection failed: {repr(e)}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_conn())

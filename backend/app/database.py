"""
Database connection and session management using SQLAlchemy 2.0 async.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from typing import AsyncGenerator
import ssl

from app.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


import re

# Create SSL context for Neon
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = True
ssl_context.verify_mode = ssl.CERT_REQUIRED

# Async engine for PostgreSQL
_db_url = settings.database_url
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _db_url.startswith("postgresql+psycopg://"):
    _db_url = _db_url.replace("postgresql+psycopg://", "postgresql+asyncpg://", 1)

# Clean channel binding and sslmode params (asyncpg handles SSL via connect_args)
_db_url = _db_url.replace("&channel_binding=require", "").replace("channel_binding=require", "")
_db_url = _db_url.replace("&sslmode=require", "").replace("sslmode=require", "")
# Clean up trailing ? if no query params left
if _db_url.endswith("?"):
    _db_url = _db_url[:-1]

engine = create_async_engine(
    _db_url,
    echo=False,  # Disable SQL echo; use logging debug level instead
    echo_pool=False,
    pool_pre_ping=True,
    pool_size=5,  # Reduced pool size for Neon free tier
    max_overflow=10,
    connect_args={
        "timeout": 30,
        "ssl": True,  # Required for Neon PostgreSQL
        "server_settings": {
            "application_name": "mouhami_api",
            "jit": "off",
        },
    },
)

# Async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency that provides a database session.
    Yields an AsyncSession and ensures proper cleanup.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """
    Initialize database tables.
    Simplified to avoid transaction rollback errors.
    """
    # Import all models to ensure they are registered
    from app.models import user, case, contract, event, invoice, notification, chat, tenant
    
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created/verified")
    except Exception as e:
        print(f"⚠️  Note: {e}")


async def close_db():
    """Close database connections."""
    await engine.dispose()


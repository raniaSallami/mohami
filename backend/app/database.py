"""
Database connection and session management using SQLAlchemy 2.0 async.
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from typing import AsyncGenerator
from urllib.parse import parse_qsl, urlparse, urlencode, urlunparse

from app.config import settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


def _normalize_database_url(url: str) -> str:
    parsed = urlparse(url)
    scheme = parsed.scheme
    if scheme in ("postgres", "postgresql", "postgresql+psycopg"):
        scheme = "postgresql+asyncpg"

    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in {"sslmode", "channel_binding"}
    ]
    cleaned_query = urlencode(query, doseq=True)

    return urlunparse(parsed._replace(scheme=scheme, query=cleaned_query))


# Async engine for PostgreSQL
_db_url = _normalize_database_url(settings.database_url)


engine = create_async_engine(
    _db_url,
    echo=False,  # Disable SQL echo; use logging debug level instead
    echo_pool=False,
    pool_pre_ping=False,  # Disable pre-ping due to pooler latency
    pool_size=1,  # Minimal pool size for Neon free tier + pooler
    max_overflow=1,
    connect_args={
        "timeout": 20,  # Give Neon 20s to wake up before failing
        "ssl": "prefer",  # Use flexible SSL mode
        "server_settings": {
            "application_name": "mouhami_api",
            "jit": "off",
        },
        "command_timeout": 30,
    },
    pool_timeout=30,  # Wait up to 30s for a connection from the pool
    pool_recycle=300,  # Recycle every 5 min
    pool_reset_on_return="none",  # Avoid reset overhead
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
    Uses very short timeout since retries are handled at lifespan level.
    """
    # Import all models to ensure they are registered
    from app.models import user, user_profile, case, contract, event, invoice, notification, chat, tenant
    
    print("🔗 Acquiring database connection...")
    # Engine connection will timeout quickly if pooler is down
    async with engine.begin() as conn:
        print("✓ Connection acquired")
        await conn.run_sync(Base.metadata.create_all)
        # Ensure the contracts.status column exists in existing databases.
        await conn.execute(
            text("ALTER TABLE contracts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft'")
        )
        # Ensure system settings column uses JSONB for structured payloads.
        try:
            await conn.execute(
                text("ALTER TABLE system_settings ALTER COLUMN value TYPE JSONB USING value::jsonb")
            )
        except Exception:
            pass


async def close_db():
    """Close database connections."""
    await engine.dispose()

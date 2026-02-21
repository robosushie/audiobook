"""Database connection and session management."""

import os
from collections.abc import AsyncGenerator

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

_user = os.environ["DATABASE_USER"]
_password = os.environ["DATABASE_PASSWORD"]
_host = os.environ["DATABASE_HOST"]
_port = os.environ["DATABASE_PORT"]
_name = os.environ["DATABASE_NAME"]

# asyncpg (async) — used by FastAPI
_async_url = f"postgresql+asyncpg://{_user}:{_password}@{_host}:{_port}/{_name}"

engine: AsyncEngine = create_async_engine(
    _async_url,
    echo=False,  # set True in development to log all SQL
    future=True,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


# ---------------------------------------------------------------------------
# FastAPI dependency — yields a session per request, always closes cleanly
# ---------------------------------------------------------------------------
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a session per request, always closes cleanly."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

"""Async database sessions for Inngest background jobs."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.db import AsyncSessionLocal


@asynccontextmanager
async def job_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a committed session for background workers (outside FastAPI deps)."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

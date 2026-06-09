"""Resolve the signed-in Clerk user to a database row."""

from fastapi import HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.error import VOICE_USER_NOT_FOUND
from src.models.user.user import User


async def resolve_current_user(request: Request, session: AsyncSession) -> User:
    clerk_id = request.state.credentials.id
    result = await session.execute(select(User).where(User.auth_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=VOICE_USER_NOT_FOUND,
        )
    return user

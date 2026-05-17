"""Users API routes. Admin only: list users."""

import asyncio
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.auth import AuthRole
from src.enums.user import Gender
from src.lib.db import get_session
from src.lib.feature.user.invite import invite_user
from src.lib.schemas.common import UserName
from src.models.user.user import User, UserDelete, UserUpdate

TAG = "Users"
router = APIRouter(prefix="/users", tags=[TAG])


class UserListRow(BaseModel):
    """User list item for admin."""

    id: UUID
    email: EmailStr
    name: UserName
    role: AuthRole
    gender: Gender
    verified: bool
    created_at: datetime


def _parse_name(raw: object) -> UserName:
    if isinstance(raw, UserName):
        return raw
    return UserName.model_validate(raw)


def _user_list_row(user: User) -> UserListRow:
    return UserListRow(
        id=user.id,
        email=user.email,
        name=_parse_name(user.name),
        role=user.role,
        gender=user.gender,
        verified=user.verified,
        created_at=user.created_at,
    )


async def _get_user_or_404(user_id: UUID, session: AsyncSession) -> User:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get(
    "",
    name="List users (no slash)",
    response_model=list[UserListRow],
    include_in_schema=False,
)
@router.get("/", name="List users", response_model=list[UserListRow])
async def list_users(
    role: AuthRole | None = Query(default=None, description="Filter by role"),
    session: AsyncSession = Depends(get_session),
) -> list[UserListRow]:
    """List users. Admin only. Optional ``role`` filter."""
    stmt = select(User).order_by(User.created_at.desc())
    if role is not None:
        stmt = stmt.where(User.role == role)
    result = await session.execute(stmt)
    users = result.scalars().all()
    return [_user_list_row(u) for u in users]


@router.get("/{user_id}", name="Get user", response_model=UserListRow)
async def get_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> UserListRow:
    """Get a user by id. Admin only."""
    user = await _get_user_or_404(user_id, session)
    return _user_list_row(user)


@router.patch("/{user_id}", name="Update user", response_model=UserListRow)
async def update_user(
    user_id: UUID,
    body: UserUpdate,
    session: AsyncSession = Depends(get_session),
) -> UserListRow:
    """Update a user. Admin only."""
    user = await _get_user_or_404(user_id, session)
    update_data = body.model_dump(exclude_unset=True)
    if "verified" in update_data:
        verified = update_data.pop("verified")
        user.verified = verified
        user.verified_at = datetime.now(UTC) if verified else None
    for key, value in update_data.items():
        setattr(user, key, value)
    await session.flush()
    await session.refresh(user)
    return _user_list_row(user)


@router.delete("/{user_id}", name="Delete user", response_model=UserDelete)
async def delete_user(
    user_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> UserDelete:
    """Delete a user from the database. Admin only."""
    user = await _get_user_or_404(user_id, session)
    await session.delete(user)
    await session.flush()
    return UserDelete(id=user_id)


class InviteUserBody(BaseModel):
    email: EmailStr
    first_name: str = Field(min_length=1, max_length=64)
    last_name: str = Field(min_length=1, max_length=64)
    role: AuthRole = AuthRole.REGULAR


class InviteUserResult(BaseModel):
    clerk_id: str
    action: str


@router.post(
    "/invite",
    name="Invite user",
    response_model=InviteUserResult,
    status_code=status.HTTP_201_CREATED,
)
async def invite_user_route(body: InviteUserBody) -> InviteUserResult:
    """Create or update a user in Clerk and the database. Admin only."""
    try:
        clerk_id, action = await asyncio.to_thread(
            invite_user,
            email=body.email,
            first_name=body.first_name,
            last_name=body.last_name,
            role=body.role,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return InviteUserResult(clerk_id=clerk_id, action=action)

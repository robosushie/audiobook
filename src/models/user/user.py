"""User SQLModel table and request/response schemas."""

from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel
from src.constants.model import ORM_METADATA
from src.enums.auth import AuthProvider, AuthRole
from src.enums.user import Gender
from src.lib.schemas.common import UserName
from src.models.common import TimestampMixin, VerificationMixin


class UserBase(SQLModel):
    """Shared user fields for create payloads and responses (no DB-only keys).

    Read/list APIs use this shape plus identifiers where needed (see route DTOs
    or the ``User`` row); a separate ``UserRead`` model is unnecessary when this
    already describes the public profile fields.
    """

    name: UserName
    avatar_url: str | None = Field(default=None, max_length=2048)
    email: EmailStr = Field(max_length=255)
    gender: Gender = Field(default=Gender.UNDISCLOSED, sa_type=String(32))
    role: AuthRole = Field(default=AuthRole.REGULAR)


class UserCreate(UserBase):
    """Payload for creating a new user (e.g. after first Clerk sign-in)."""

    auth_id: str = Field(min_length=1, max_length=128)
    auth_provider: AuthProvider = AuthProvider.CLERK


class UserUpdate(SQLModel):
    """All fields optional — PATCH semantics."""

    name: UserName | None = None
    avatar_url: str | None = None
    email: EmailStr | None = None
    gender: Gender | None = None
    role: AuthRole | None = None
    verified: bool | None = None


class UserDelete(SQLModel):
    """Confirmation payload returned after deleting a user."""

    id: UUID
    deleted: bool = True


class User(UserBase, TimestampMixin, VerificationMixin, table=True):
    """Registered user — one row per person regardless of auth provider."""

    metadata = ORM_METADATA
    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    email: EmailStr = Field(max_length=255, unique=True, index=True)
    name: UserName = Field(sa_column=Column(JSONB, nullable=False))
    auth_id: str = Field(
        min_length=1,
        max_length=128,
        sa_column=Column("external_auth_id", String(128), nullable=False, unique=True),
    )
    auth_provider: AuthProvider = Field(default=AuthProvider.CLERK)

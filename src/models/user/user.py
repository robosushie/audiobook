"""User models — table + Pydantic read/write variants."""

from uuid import UUID, uuid4

from pydantic import EmailStr
from sqlmodel import Field, SQLModel

from src.enums.auth import AuthProvider, ClerkRole
from src.models.common import TimestampMixin, VerificationMixin


# ---------------------------------------------------------------------------
# Shared field definitions (base — not a table)
# ---------------------------------------------------------------------------


class UserBase(SQLModel):
    """Fields shared by all user schemas."""

    email: EmailStr = Field(max_length=255, unique=True, index=True)
    first_name: str = Field(max_length=64)
    middle_name: str | None = Field(default=None, max_length=64)
    last_name: str = Field(max_length=64)
    avatar_url: str | None = Field(default=None, max_length=2048)


class UserCreate(UserBase):
    """Payload for creating a new user (e.g. after first Clerk sign-in)."""

    external_auth_id: str
    auth_provider: AuthProvider = AuthProvider.CLERK
    role: ClerkRole = ClerkRole.USER


class UserUpdate(SQLModel):
    """All fields optional — PATCH semantics."""

    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None


class UserDelete(SQLModel):
    """Confirmation payload returned after deleting a user."""

    id: UUID
    deleted: bool = True


class UserRead(UserBase):
    """Public-safe representation of a user returned from the API."""

    id: UUID
    external_auth_id: str
    auth_provider: AuthProvider
    role: ClerkRole
    verified: bool


# ---------------------------------------------------------------------------
# DB table model
# ---------------------------------------------------------------------------


class User(TimestampMixin, VerificationMixin, UserBase, table=True):
    """Registered user — one row per person regardless of auth provider."""

    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    external_auth_id: str = Field(max_length=128, unique=True, index=True)
    auth_provider: AuthProvider = Field(default=AuthProvider.CLERK)
    role: ClerkRole = Field(default=ClerkRole.USER)

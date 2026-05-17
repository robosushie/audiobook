"""Common mixins for SQLModel models."""

from datetime import UTC, datetime

from sqlalchemy import func
from sqlmodel import DateTime, Field


def _utc_now() -> datetime:
    """Return current UTC time for ORM defaults (DB still has server_default)."""
    return datetime.now(UTC)


class TimestampMixin:
    """Mixin for SQLModel models with audit fields."""

    created_at: datetime = Field(
        default_factory=_utc_now,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={"server_default": func.now(), "nullable": False},
    )
    updated_at: datetime = Field(
        default_factory=_utc_now,
        sa_type=DateTime(timezone=True),
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
            "nullable": False,
        },
    )


class VerificationMixin:
    """Mixin for SQLModel models with verification fields."""

    verified: bool = Field(default=False)
    verified_at: datetime | None = Field(
        default=None,
        sa_type=DateTime(timezone=True),
    )

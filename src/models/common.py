"""Common mixins for SQLModel models."""

from datetime import datetime

from sqlalchemy import DateTime, func
from sqlmodel import Field


class TimestampMixin:
    """Mixin for SQLModel models with audit fields."""

    created_at: datetime = Field(
        sa_column_kwargs={
            "server_default": func.now(),
            "type_": DateTime(timezone=True),
        },
    )
    updated_at: datetime = Field(
        sa_column_kwargs={
            "server_default": func.now(),
            "onupdate": func.now(),
            "type_": DateTime(timezone=True),
        },
    )


class VerificationMixin:
    """Mixin for SQLModel models with verification fields."""

    verified: bool = Field(default=False)
    verified_at: datetime | None = Field(
        default=None,
        sa_column_kwargs={"type_": DateTime(timezone=True)},
    )

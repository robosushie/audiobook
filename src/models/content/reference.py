"""Shared reading-passage reference text (many voice profiles can point to one row)."""

from uuid import UUID, uuid4

from sqlalchemy import String, Text
from sqlmodel import Field, SQLModel

from src.constants.model import ORM_METADATA
from src.enums.language import Language
from src.models.common import TimestampMixin


class ReferenceBase(SQLModel):
    """Fields shared by reference schemas."""

    text: str = Field(sa_type=Text())
    language: Language = Field(sa_type=String(16))


class ReferenceCreate(ReferenceBase):
    """Payload to create a shared reference passage."""


class ReferenceUpdate(SQLModel):
    """PATCH-safe update fields."""

    text: str | None = None
    language: Language | None = None


class ReferenceDelete(SQLModel):
    """Confirmation payload returned after deleting a reference."""

    id: UUID
    deleted: bool = True


class ReferenceRead(ReferenceBase):
    """API response for a reference passage."""

    id: UUID


class Reference(ReferenceBase, TimestampMixin, table=True):
    """Canonical passage text + language for STT alignment and cloning."""

    metadata = ORM_METADATA
    __tablename__ = "reference"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

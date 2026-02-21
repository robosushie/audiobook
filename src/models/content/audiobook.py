"""Audiobook models — table + Pydantic read/write variants."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel

from src.enums.media import AudiobookStatus
from src.models.common import TimestampMixin


class AudiobookBase(SQLModel):
    """Fields shared by all audiobook schemas."""

    status: AudiobookStatus = Field(default=AudiobookStatus.QUEUED)
    content_url: str | None = Field(default=None, max_length=2048)
    duration: float | None = None


class AudiobookCreate(AudiobookBase):
    """Payload to enqueue a new audiobook generation job."""

    user_id: UUID
    book_id: UUID
    voice_profile_id: UUID


class AudiobookUpdate(SQLModel):
    """PATCH-safe update fields (used by the generation worker)."""

    status: AudiobookStatus | None = None
    content_url: str | None = None
    duration: float | None = None
    completed_at: datetime | None = None


class AudiobookDelete(SQLModel):
    """Confirmation payload returned after deleting an audiobook."""

    id: UUID
    deleted: bool = True


class AudiobookRead(AudiobookBase):
    """API response representation of an audiobook."""

    id: UUID
    user_id: UUID
    book_id: UUID
    voice_profile_id: UUID
    completed_at: datetime | None


class Audiobook(TimestampMixin, AudiobookBase, table=True):
    """A personalised audiobook generated for a specific user."""

    __tablename__ = "audiobooks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="users.id", index=True)
    book_id: UUID = Field(foreign_key="books.id", index=True)
    voice_profile_id: UUID = Field(foreign_key="voice_profiles.id", index=True)

    completed_at: datetime | None = Field(
        default=None,
        sa_column_kwargs={"type_": DateTime(timezone=True)},
    )

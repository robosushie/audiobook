"""Playback models — table + Pydantic read/write variants."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel


class PlaybackBase(SQLModel):
    """Fields shared by all playback schemas."""

    progress: float = Field(default=0.0, ge=0.0)
    last_played_at: datetime | None = Field(
        default=None,
        sa_column_kwargs={"type_": DateTime(timezone=True)},
    )


class PlaybackCreate(PlaybackBase):
    """Payload to create or initialise a playback record."""

    user_id: UUID
    audiobook_id: UUID


class PlaybackUpdate(SQLModel):
    """PATCH-safe update fields — called whenever the player reports position."""

    progress: float | None = None
    last_played_at: datetime | None = None


class PlaybackDelete(SQLModel):
    """Confirmation payload returned after deleting a playback record."""

    id: UUID
    deleted: bool = True


class PlaybackRead(PlaybackBase):
    """API response representation of a playback record."""

    id: UUID
    user_id: UUID
    audiobook_id: UUID


class Playback(PlaybackBase, table=True):
    """Tracks where a user left off in a specific audiobook."""

    __tablename__ = "playbacks"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="users.id", index=True)
    audiobook_id: UUID = Field(foreign_key="audiobooks.id", index=True)

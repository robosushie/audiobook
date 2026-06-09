"""Server-sent event payloads for the mobile app."""

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

UserEventType = Literal[
    "voice.created",
    "voice.updated",
    "audiobook.created",
    "audiobook.updated",
]


class UserSSEEnvelope(BaseModel):
    """Wire format for one SSE message."""

    model_config = ConfigDict(extra="forbid")

    type: UserEventType
    data: dict[str, Any]


class VoiceSSEPayload(BaseModel):
    id: UUID
    user_id: UUID
    reference_id: UUID
    label: str
    status: str
    duration: float
    language: str
    raw_url: str | None = None
    audio_url: str | None = None


class AudiobookSSEPayload(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    voice_profile_id: UUID
    status: str
    content_url: str | None = None
    duration: float | None = None
    book_title: str | None = None
    book_cover_url: str | None = None
    playback_progress: float = 0.0

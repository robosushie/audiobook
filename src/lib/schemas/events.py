"""Inngest event payloads (not persisted — domain state lives on Voice / Audiobook rows)."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict

from src.enums.cloner import ClonerType


class VoicePreprocessEventData(BaseModel):
    """Trigger voice clip + STT alignment + storage upload."""

    model_config = ConfigDict(extra="forbid")

    profile_id: UUID
    user_id: UUID


class AudiobookGenerateEventData(BaseModel):
    """Trigger audiobook cloning for an existing audiobook row."""

    model_config = ConfigDict(extra="forbid")

    audiobook_id: UUID
    cloner_type: ClonerType | None = None

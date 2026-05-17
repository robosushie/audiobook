"""Pydantic schemas for voice cloning and audiobook generation."""

from uuid import UUID

from pydantic import BaseModel, Field

from src.enums.cloner import ClonerType
from src.enums.language import Language


class CloneRequest(BaseModel):
    """Reference voice + manuscript text to synthesize."""

    reference_audio: bytes
    reference_text: str = Field(min_length=1)
    source_text: str = Field(min_length=1)
    language: Language


class CloneResult(BaseModel):
    """Synthesized audiobook audio."""

    audio_bytes: bytes
    duration: float = Field(ge=0.0)


class GenerateAudiobookRequest(BaseModel):
    """Inputs to generate a personalised audiobook from a book + voice profile."""

    voice_profile_id: UUID
    book_id: UUID
    user_id: UUID
    cloner_type: ClonerType | None = None

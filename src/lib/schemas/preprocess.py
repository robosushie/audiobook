"""Pydantic payload for the stateless voice-preprocess service."""

from pydantic import BaseModel, Field


class PrepareResult(BaseModel):
    """Clean reference clip and the passage substring spoken in it."""

    audio_wav_base64: str = Field(min_length=1)
    reference_text: str = Field(min_length=1)
    duration: float = Field(ge=0.0)
    alignment_score: float = Field(ge=0.0)

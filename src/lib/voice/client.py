"""HTTP client for the stateless voice-preprocess service."""

from __future__ import annotations

import base64
import os
from dataclasses import dataclass
from typing import TYPE_CHECKING

import httpx
from src.constants.language import language_slug
from src.constants.voice import PREPARE_HTTP_TIMEOUT_SECONDS
from src.lib.module.jobs.errors import NonRetriableError
from src.lib.schemas.preprocess import PrepareResult

if TYPE_CHECKING:
    from src.enums.language import Language

_DEFAULT_BASE_URL = "http://127.0.0.1:8003"


@dataclass(frozen=True, slots=True)
class PreparedClip:
    """Clip returned by the preprocess service."""

    wav_bytes: bytes
    reference_text: str
    duration: float
    alignment_score: float


def preprocess_base_url() -> str:
    """Base URL of the preprocess container."""
    return os.environ.get("PREPROCESS_BASE_URL", _DEFAULT_BASE_URL).rstrip("/")


async def prepare_voice_clip(
    *,
    voice_data: bytes,
    reference_text: str,
    language: Language | str,
) -> PreparedClip:
    """Send a raw recording and passage to the preprocess service."""
    timeout = httpx.Timeout(PREPARE_HTTP_TIMEOUT_SECONDS, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.post(
            f"{preprocess_base_url()}/api/prepare",
            files={"audio": ("recording.wav", voice_data, "audio/wav")},
            data={
                "reference_text": reference_text,
                "language": language_slug(language),
            },
        )

    if response.status_code == 422:
        raise NonRetriableError(_reject_detail(response))
    response.raise_for_status()

    payload = PrepareResult.model_validate(response.json())
    return PreparedClip(
        wav_bytes=base64.b64decode(payload.audio_wav_base64),
        reference_text=payload.reference_text,
        duration=payload.duration,
        alignment_score=payload.alignment_score,
    )


def _reject_detail(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return "Voice preprocess rejected the recording"
    if isinstance(body, dict) and body.get("detail"):
        return str(body["detail"])
    return "Voice preprocess rejected the recording"

"""HTTP client for the stateless voice-cloner service."""

from __future__ import annotations

import os
from typing import TYPE_CHECKING

import httpx
from src.constants.language import language_slug
from src.lib.module.jobs.errors import NonRetriableError
from src.lib.schemas.cloner import CloneResult

if TYPE_CHECKING:
    from src.enums.cloner import ClonerType
    from src.enums.language import Language

_DEFAULT_BASE_URL = "http://127.0.0.1:8002"
_CLONE_TIMEOUT_SECONDS = 3600.0


def cloner_base_url() -> str:
    """Return the cloner service base URL."""
    return os.environ.get("CLONER_BASE_URL", _DEFAULT_BASE_URL).rstrip("/")


def clone_speech_http(
    *,
    reference_audio: bytes,
    reference_text: str,
    source_text: str,
    language: Language | str,
    cloner_type: ClonerType | None = None,
) -> CloneResult:
    """POST a reference clip and manuscript; return the synthesized WAV."""
    data = {
        "reference_text": reference_text,
        "source_text": source_text,
        "language": language_slug(language),
    }
    if cloner_type is not None:
        data["cloner_type"] = cloner_type.value

    timeout = httpx.Timeout(_CLONE_TIMEOUT_SECONDS, connect=10.0)
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(
                f"{cloner_base_url()}/api/clone",
                files={
                    "reference_audio": (
                        "reference.wav",
                        reference_audio,
                        "audio/wav",
                    ),
                },
                data=data,
            )
    except httpx.HTTPError as exc:
        msg = f"Cloner request failed: {exc}"
        raise RuntimeError(msg) from exc

    if response.is_client_error:
        raise NonRetriableError(_reject_detail(response))
    response.raise_for_status()

    try:
        duration = float(response.headers.get("X-Audio-Duration", "0"))
    except ValueError:
        duration = 0.0
    return CloneResult(audio_bytes=response.content, duration=duration)


def _reject_detail(response: httpx.Response) -> str:
    try:
        body = response.json()
    except ValueError:
        return "Voice cloner rejected the request"
    if isinstance(body, dict) and body.get("detail"):
        return str(body["detail"])
    return "Voice cloner rejected the request"

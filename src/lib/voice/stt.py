"""Groq Whisper speech-to-text for voice clip alignment."""

import os

from groq import Groq

from src.constants.language import language_to_iso
from src.constants.voice import WHISPER_MODEL
from src.enums.language import Language
from src.lib.error import GROQ_API_KEY_MISSING


def _groq_client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(GROQ_API_KEY_MISSING)
    return Groq(api_key=api_key)


def transcribe_wav(wav_bytes: bytes, language: Language) -> str:
    """Transcribe a WAV clip with Groq whisper-large-v3."""
    client = _groq_client()
    iso = language_to_iso(language)
    transcription = client.audio.transcriptions.create(
        file=("clip.wav", wav_bytes),
        model=WHISPER_MODEL,
        language=iso,
        response_format="text",
        temperature=0.0,
    )
    if isinstance(transcription, str):
        return transcription.strip()
    text = getattr(transcription, "text", None)
    if text:
        return str(text).strip()
    return str(transcription).strip()

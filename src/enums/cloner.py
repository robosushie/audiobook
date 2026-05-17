"""Voice cloning backend identifiers."""

from enum import StrEnum


class ClonerType(StrEnum):
    """TTS / voice-cloning engine used to synthesize audiobook audio."""

    F5TTS = "f5tts"
    XTTSV2 = "xttsv2"

"""Voice cloning backend identifiers."""

from enum import StrEnum


class ClonerType(StrEnum):
    """TTS / voice-cloning engine used to synthesize audiobook audio."""

    INDICF5 = "indicf5"
    CHATTERBOX = "chatterbox"
    HABIBITTS = "habitibtts"

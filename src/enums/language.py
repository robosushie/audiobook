"""Natural languages supported in the product (catalogue, voice, TTS, etc.)."""

from enum import StrEnum


class Language(StrEnum):
    """BCP-style slug values for API and storage."""

    ENGLISH = "english"
    HINDI = "hindi"
    MALAYALAM = "malayalam"
    TAMIL = "tamil"
    ODIYA = "odia"
    ARABIC = "arabic"

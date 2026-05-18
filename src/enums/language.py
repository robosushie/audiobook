"""Natural languages supported in the product (catalogue, voice, TTS, etc.)."""

from enum import StrEnum


class Language(StrEnum):
    """BCP-style slug values for API and storage."""

    ENGLISH = "english"
    ASSAMESE = "assamese"
    BENGALI = "bengali"
    GUJARATI = "gujarati"
    HINDI = "hindi"
    ARABIC = "arabic"
    KANNADA = "kannada"
    MALAYALAM = "malayalam"
    MARATHI = "marathi"
    ODIYA = "odia"
    PUNJABI = "punjabi"
    TAMIL = "tamil"
    TELUGU = "telugu"

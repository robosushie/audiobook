"""Per-language settings: ISO codes, default cloner, and related lookups."""

from dataclasses import dataclass

from src.enums.cloner import ClonerType
from src.enums.language import Language


@dataclass(frozen=True, slots=True)
class LanguageSettings:
    """Configuration shared across STT, cloning, and TTS pipelines."""

    iso: str
    cloner: ClonerType


LANGUAGE_SETTINGS: dict[Language, LanguageSettings] = {
    Language.ENGLISH: LanguageSettings(iso="en", cloner=ClonerType.F5TTS),
    Language.HINDI: LanguageSettings(iso="hi", cloner=ClonerType.XTTSV2),
    Language.ARABIC: LanguageSettings(iso="ar", cloner=ClonerType.XTTSV2),
    Language.KANNADA: LanguageSettings(iso="kn", cloner=ClonerType.XTTSV2),
    Language.MALAYALAM: LanguageSettings(iso="ml", cloner=ClonerType.XTTSV2),
    Language.MARATHI: LanguageSettings(iso="mr", cloner=ClonerType.XTTSV2),
    Language.ODIYA: LanguageSettings(iso="or", cloner=ClonerType.XTTSV2),
    Language.PUNJABI: LanguageSettings(iso="pa", cloner=ClonerType.XTTSV2),
    Language.TAMIL: LanguageSettings(iso="ta", cloner=ClonerType.XTTSV2),
    Language.TELUGU: LanguageSettings(iso="te", cloner=ClonerType.XTTSV2),
}

_DEFAULT = LanguageSettings(iso="en", cloner=ClonerType.XTTSV2)


def get_language_settings(language: Language) -> LanguageSettings:
    """Return settings for a language, with a safe fallback."""
    return LANGUAGE_SETTINGS.get(language, _DEFAULT)


def language_to_iso(language: Language) -> str:
    """ISO-639-1 code for Whisper, XTTS, and other locale-aware APIs."""
    return get_language_settings(language).iso


def cloner_for_language(language: Language) -> ClonerType:
    """Default cloning backend for a catalogue / voice language."""
    return get_language_settings(language).cloner

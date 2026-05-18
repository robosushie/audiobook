"""Per-language settings: ISO codes, default cloner, and related lookups."""

from dataclasses import dataclass

from src.enums.cloner import ClonerType
from src.enums.language import Language


@dataclass(frozen=True, slots=True)
class LanguageSettings:
    """Configuration shared across STT, cloning, and TTS pipelines."""

    iso: str
    cloner: ClonerType


_INDICF5_LANGUAGES: frozenset[Language] = frozenset(
    {
        Language.ASSAMESE,
        Language.BENGALI,
        Language.GUJARATI,
        Language.HINDI,
        Language.KANNADA,
        Language.MALAYALAM,
        Language.MARATHI,
        Language.ODIYA,
        Language.PUNJABI,
        Language.TAMIL,
        Language.TELUGU,
    }
)

LANGUAGE_SETTINGS: dict[Language, LanguageSettings] = {
    Language.ENGLISH: LanguageSettings(iso="en", cloner=ClonerType.XTTSV2),
    Language.ASSAMESE: LanguageSettings(iso="as", cloner=ClonerType.INDICF5),
    Language.BENGALI: LanguageSettings(iso="bn", cloner=ClonerType.INDICF5),
    Language.GUJARATI: LanguageSettings(iso="gu", cloner=ClonerType.INDICF5),
    Language.HINDI: LanguageSettings(iso="hi", cloner=ClonerType.INDICF5),
    Language.ARABIC: LanguageSettings(iso="ar", cloner=ClonerType.XTTSV2),
    Language.KANNADA: LanguageSettings(iso="kn", cloner=ClonerType.INDICF5),
    Language.MALAYALAM: LanguageSettings(iso="ml", cloner=ClonerType.INDICF5),
    Language.MARATHI: LanguageSettings(iso="mr", cloner=ClonerType.INDICF5),
    Language.ODIYA: LanguageSettings(iso="or", cloner=ClonerType.INDICF5),
    Language.PUNJABI: LanguageSettings(iso="pa", cloner=ClonerType.INDICF5),
    Language.TAMIL: LanguageSettings(iso="ta", cloner=ClonerType.INDICF5),
    Language.TELUGU: LanguageSettings(iso="te", cloner=ClonerType.INDICF5),
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


def uses_indicf5(language: Language) -> bool:
    """Whether synthesis should use IndicF5 for this language."""
    return language in _INDICF5_LANGUAGES

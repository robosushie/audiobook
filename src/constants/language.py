"""Per-language settings: ISO codes, default cloner, and related lookups."""

from dataclasses import dataclass

from src.enums.cloner import ClonerType
from src.enums.language import Language


@dataclass(frozen=True, slots=True)
class LanguageSettings:
    """Configuration shared across alignment, cloning, and TTS pipelines."""

    iso: str
    iso639_3: str
    cloner: ClonerType


# IndicF5 remains implemented, but Hindi synthesis uses Chatterbox.
# Malayalam, Tamil, and Odia stay mapped here and are hidden in the apps.
_INDICF5_LANGUAGES: frozenset[Language] = frozenset(
    {
        Language.MALAYALAM,
        Language.TAMIL,
        Language.ODIYA,
    },
)

LANGUAGE_SETTINGS: dict[Language, LanguageSettings] = {
    Language.ENGLISH: LanguageSettings(iso="en", iso639_3="eng", cloner=ClonerType.CHATTERBOX),
    Language.HINDI: LanguageSettings(iso="hi", iso639_3="hin", cloner=ClonerType.CHATTERBOX),
    Language.MALAYALAM: LanguageSettings(iso="ml", iso639_3="mal", cloner=ClonerType.INDICF5),
    Language.TAMIL: LanguageSettings(iso="ta", iso639_3="tam", cloner=ClonerType.INDICF5),
    Language.ODIYA: LanguageSettings(iso="or", iso639_3="ori", cloner=ClonerType.INDICF5),
    Language.ARABIC: LanguageSettings(iso="ar", iso639_3="ara", cloner=ClonerType.HABIBITTS),
}

_DEFAULT = LanguageSettings(iso="en", iso639_3="eng", cloner=ClonerType.CHATTERBOX)


def language_slug(language: Language | str) -> str:
    """Return the catalogue slug for an enum or a string loaded from the database."""
    return Language(language).value


def get_language_settings(language: Language) -> LanguageSettings:
    """Return settings for a language, with a safe fallback."""
    return LANGUAGE_SETTINGS.get(language, _DEFAULT)


def language_to_iso(language: Language) -> str:
    """ISO-639-1 code for locale-aware APIs."""
    return get_language_settings(language).iso


def language_to_iso639_3(language: Language) -> str:
    """ISO-639-3 code for the MMS forced aligner."""
    return get_language_settings(language).iso639_3


def cloner_for_language(language: Language) -> ClonerType:
    """Default cloning backend for a catalogue / voice language."""
    return get_language_settings(language).cloner


def uses_indicf5(language: Language) -> bool:
    """Whether synthesis should use IndicF5 for this language."""
    return language in _INDICF5_LANGUAGES

"""In-process cloner factory (no database or Redis)."""

import logging

from src.constants.language import cloner_for_language
from src.enums.cloner import ClonerType
from src.enums.language import Language
from src.lib.cloner.base import VoiceCloner
from src.lib.error import UNSUPPORTED_CLONER_TYPE
from src.lib.schemas.cloner import CloneRequest, CloneResult

logger = logging.getLogger(__name__)

_CLONERS: dict[ClonerType, VoiceCloner] = {}


def create_cloner(cloner_type: ClonerType) -> VoiceCloner:
    """Return a cached cloner for ``cloner_type`` (one backend in VRAM at a time)."""
    if cloner_type in _CLONERS:
        return _CLONERS[cloner_type]

    for existing_type, existing in list(_CLONERS.items()):
        existing.unload()
        del _CLONERS[existing_type]

    if cloner_type is ClonerType.INDICF5:
        from src.lib.cloner.indicf5.cloner import IndicF5Cloner

        cloner: VoiceCloner = IndicF5Cloner()
    elif cloner_type is ClonerType.CHATTERBOX:
        from src.lib.cloner.chatterbox.cloner import ChatterboxCloner

        cloner = ChatterboxCloner()
    elif cloner_type is ClonerType.HABIBITTS:
        from src.lib.cloner.habibi.cloner import HabibiTTSCloner

        cloner = HabibiTTSCloner()
    else:
        raise ValueError(UNSUPPORTED_CLONER_TYPE.format(cloner_type=cloner_type))

    _CLONERS[cloner_type] = cloner
    return cloner


def resolve_cloner_type(
    language: Language,
    override: ClonerType | None = None,
) -> ClonerType:
    """Pick cloner from override or ``constants.language`` defaults."""
    return override if override is not None else cloner_for_language(language)


def clone_speech(
    request: CloneRequest,
    *,
    cloner_type: ClonerType | None = None,
) -> CloneResult:
    """Run voice cloning and return synthesized audio."""
    backend = resolve_cloner_type(request.language, cloner_type)
    logger.info(
        "clone_speech backend=%s language=%s source_chars=%d ref_chars=%d",
        backend.value,
        request.language.value,
        len(request.source_text),
        len(request.reference_text),
    )
    return create_cloner(backend).clone(request)

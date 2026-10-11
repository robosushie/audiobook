"""Voice cloner protocol."""

from abc import ABC, abstractmethod

from src.lib.schemas.cloner import CloneRequest, CloneResult


class VoiceCloner(ABC):
    """Clone a speaker from reference audio and synthesize new speech."""

    @abstractmethod
    def clone(self, request: CloneRequest) -> CloneResult:
        """Synthesize ``request.source_text`` in the reference speaker's voice."""

    def unload(self) -> None:
        """Release GPU weights so another backend can load. Default is a no-op."""
        return None

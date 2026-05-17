# Import every model module here so Alembic's autogenerate picks them up.
# `constants.model` configures SQLModel.metadata (ORM_METADATA) before tables register.
import src.constants.model  # noqa: F401

from src.models.content.audiobook import Audiobook
from src.models.content.book import Book
from src.models.content.reference import Reference
from src.models.content.review import Review
from src.models.content.voice import Voice
from src.models.player.playback import Playback
from src.models.user.user import User

__all__ = [
    "Audiobook",
    "Book",
    "Playback",
    "Reference",
    "Review",
    "User",
    "Voice",
]

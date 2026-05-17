"""User profile enums."""

from enum import StrEnum


class Gender(StrEnum):
    """User-reported gender."""

    UNDISCLOSED = "undisclosed"
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

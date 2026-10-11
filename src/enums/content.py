"""Content and catalogue enums."""

from enum import StrEnum


class BookCategory(StrEnum):
    """Category/tag for books — used for filtering and discovery."""

    ADVENTURE = "adventure"
    FAIRYTALE = "fairytale"
    MYTHICAL = "mythical"
    FANTASY = "fantasy"
    SCIENCE_FICTION = "science_fiction"
    MYSTERY = "mystery"
    BIOGRAPHY = "biography"
    HISTORY = "history"
    OTHER = "other"

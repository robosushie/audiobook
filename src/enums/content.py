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
    HORROR = "horror"
    BIOGRAPHY = "biography"
    HISTORY = "history"
    RELIGION = "religion"
    OTHER = "other"

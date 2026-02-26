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
    ROMANCE = "romance"
    HORROR = "horror"
    BIOGRAPHY = "biography"
    HISTORY = "history"
    CHILDREN = "children"
    YOUNG_ADULT = "young_adult"
    SELF_HELP = "self_help"
    RELIGION = "religion"
    OTHER = "other"

"""Book API response shapes (non-ORM)."""

from sqlmodel import SQLModel


class BookContentRead(SQLModel):
    """Manuscript text fetched from object storage."""

    content: str

"""Shared schemas and value types (Pydantic / SQLModel)."""

from sqlmodel import SQLModel


class UserName(SQLModel):
    """Structured user name — API validation and JSONB persistence via SQLModel."""

    first: str
    middle: str | None = None
    last: str

    @property
    def full(self) -> str:
        """Return the full name."""
        parts = [self.first, self.middle, self.last]
        return " ".join(p for p in parts if p)

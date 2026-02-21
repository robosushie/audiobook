"""User-related Pydantic schemas."""

from pydantic import BaseModel


class UserName(BaseModel):
    """Structured name broken into parts."""

    first: str
    middle: str | None = None
    last: str

    @property
    def full(self) -> str:
        """Return the full name."""
        parts = [self.first, self.middle, self.last]
        return " ".join(p for p in parts if p)

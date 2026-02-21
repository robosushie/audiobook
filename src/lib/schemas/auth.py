"""Auth-related Pydantic schemas."""

from pydantic import BaseModel
from src.enums.auth import ClerkRole


class ClerkCredentials(BaseModel):
    """Parsed and validated credentials extracted from a Clerk JWT payload."""

    id: str
    type: str
    role: ClerkRole

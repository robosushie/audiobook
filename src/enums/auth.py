"""Authentication and user-related enums."""

from enum import StrEnum


class ClerkRole(StrEnum):
    """User roles stored in Clerk JWT metadata and mirrored in the DB."""

    ADMIN = "admin"
    USER = "user"


class AuthProvider(StrEnum):
    """External authentication providers."""

    CLERK = "clerk"
    FIREBASE = "firebase"
    AUTH0 = "auth0"

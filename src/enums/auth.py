"""Authentication and user-related enums."""

from enum import StrEnum


class ClerkRole(StrEnum):
    """User roles stored in Clerk JWT metadata and mirrored in the DB."""

    ADMIN = "admin"
    REGULAR = "regular"


class AuthProvider(StrEnum):
    """External authentication providers."""

    CLERK = "clerk"
    FIREBASE = "firebase"
    AUTH0 = "auth0"

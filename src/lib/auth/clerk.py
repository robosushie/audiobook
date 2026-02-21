"""Clerk authentication dependency for FastAPI."""

import os
from collections.abc import Callable

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import HTTPException, Request, status
from src.enums.auth import ClerkRole
from src.lib.schemas.auth import ClerkCredentials


def create_authorization(
    required_roles: set[ClerkRole] | None = None,
) -> Callable[[Request], None]:
    """Create an authorization dependency for FastAPI routes.

    Args:
        required_roles: Set of roles allowed to access the route.
                        Pass None to allow any authenticated user.

    Returns:
        A FastAPI-compatible dependency function that validates the request.

    """

    def authorize(request: Request) -> None:
        """Authenticate and authorize the incoming request via Clerk."""
        sdk = Clerk(bearer_auth=os.environ["CLERK_SECRET_KEY"])
        auth_state = sdk.authenticate_request(
            request,
            AuthenticateRequestOptions(),
        )

        if not auth_state.is_signed_in or not auth_state.payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=auth_state.message or "Not authenticated",
            )

        payload = auth_state.payload
        metadata = payload.get("metadata", {})

        # Extract and validate role
        role_raw: str = metadata.get("role", "").lower()
        try:
            role = ClerkRole(role_raw)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invalid role in token payload: {role_raw!r}",
            ) from exc

        # Extract token type
        token_type: str | None = metadata.get("type")
        if not token_type:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Missing type in token payload",
            )

        credentials = ClerkCredentials(
            id=payload["sub"],
            type=token_type,
            role=role,
        )

        if required_roles and credentials.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your role is not authorized to access this resource",
            )

        request.state.credentials = credentials

    return authorize

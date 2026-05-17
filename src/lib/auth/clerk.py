"""Clerk authentication dependency for FastAPI."""

import os
from collections.abc import Callable

from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import HTTPException, Request, status
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from src.enums.auth import AuthRole
from src.lib.schemas.auth import ClerkCredentials
from src.models.user.user import User

_session_factory: sessionmaker[Session] | None = None


def _session() -> sessionmaker[Session]:
    global _session_factory  # noqa: PLW0603
    if _session_factory is None:
        user = os.environ["DATABASE_USER"]
        password = os.environ["DATABASE_PASSWORD"]
        host = os.environ["DATABASE_HOST"]
        port = os.environ["DATABASE_PORT"]
        name = os.environ["DATABASE_NAME"]
        url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"
        engine = create_engine(url)
        _session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    return _session_factory


def _merge_claim_metadata(payload: dict) -> dict:
    """Collect Clerk public/private metadata from common JWT claim shapes."""
    merged: dict = {}
    for key in ("public_metadata", "unsafe_metadata", "metadata"):
        block = payload.get(key)
        if isinstance(block, dict):
            merged.update(block)
    nested = merged.get("public_metadata")
    if isinstance(nested, dict):
        merged = {**nested, **{k: v for k, v in merged.items() if k != "public_metadata"}}
    return merged


def _role_from_db(clerk_user_id: str) -> AuthRole | None:
    try:
        with _session()() as session:
            row = session.execute(
                select(User.role).where(User.auth_id == clerk_user_id),
            ).scalar_one_or_none()
        return row
    except Exception:
        return None


def create_authorization(
    required_roles: set[AuthRole] | None = None,
) -> Callable[[Request], None]:
    """Create an authorization dependency for FastAPI routes."""

    def authorize(request: Request) -> None:
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
        metadata = _merge_claim_metadata(payload)

        role_raw = metadata.get("role") or payload.get("role")
        role: AuthRole | None = None
        if isinstance(role_raw, AuthRole):
            role = role_raw
        elif isinstance(role_raw, str) and role_raw.strip():
            try:
                role = AuthRole(role_raw.strip().lower())
            except ValueError:
                role = None

        if role is None:
            clerk_id = payload.get("sub")
            if isinstance(clerk_id, str):
                role = _role_from_db(clerk_id)
            if role is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Invalid role in token payload: {role_raw!r}",
                )

        token_type = metadata.get("type") or payload.get("type")
        if not token_type:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Missing type in token payload",
            )

        credentials = ClerkCredentials(
            id=payload["sub"],
            type=str(token_type),
            role=role,
        )

        if required_roles and credentials.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your role is not authorized to access this resource",
            )

        request.state.credentials = credentials

    return authorize

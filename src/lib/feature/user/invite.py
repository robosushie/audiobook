"""Invite users via Clerk + DB (admin bootstrap-style)."""

from __future__ import annotations

import os
from typing import Any

from clerk_backend_api import Clerk
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from src.enums.auth import AuthProvider, AuthRole
from src.enums.user import Gender
from src.lib.schemas.common import UserName
from src.models.user.user import User

DEFAULT_PASSWORD = "Audiobook@Invite123"  # noqa: S105


def _sync_session() -> sessionmaker[Session]:
    user = os.environ["DATABASE_USER"]
    password = os.environ["DATABASE_PASSWORD"]
    host = os.environ["DATABASE_HOST"]
    port = os.environ["DATABASE_PORT"]
    name = os.environ["DATABASE_NAME"]
    url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"
    engine = create_engine(url)
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def _get_clerk_user(clerk: Clerk, email: str) -> Any | None:
    normalized = email.strip().lower()
    try:
        resp = clerk.users.list(request={"email_address": [normalized], "limit": 1})
    except TypeError:
        resp = clerk.users.list(email_address=[normalized], limit=1)
    data = getattr(resp, "data", None) or []
    if isinstance(resp, list):
        data = resp
    return data[0] if data else None


def invite_user(
    *,
    email: str,
    first_name: str,
    last_name: str,
    role: AuthRole,
) -> tuple[str, str]:
    """Create or update Clerk user and DB row. Returns ``(clerk_id, action)``."""
    if not os.environ.get("CLERK_SECRET_KEY"):
        msg = "CLERK_SECRET_KEY is not configured"
        raise RuntimeError(msg)

    email_norm = email.strip().lower()
    name = UserName(first=first_name.strip(), last=last_name.strip())
    public_metadata = {"role": role.value, "type": "individual"}
    clerk = Clerk(bearer_auth=os.environ["CLERK_SECRET_KEY"])

    existing = _get_clerk_user(clerk, email_norm)
    if existing:
        clerk_id = str(existing.id)
        try:
            clerk.users.update(
                user_id=clerk_id,
                first_name=name.first,
                last_name=name.last,
                public_metadata=public_metadata,
            )
        except Exception:
            clerk.users.update_metadata(user_id=clerk_id, public_metadata=public_metadata)
        action = "updated"
    else:
        new_user = clerk.users.create(
            email_address=[email_norm],
            first_name=name.first,
            last_name=name.last,
            password=os.environ.get("BOOTSTRAP_PASSWORD", DEFAULT_PASSWORD),
            public_metadata=public_metadata,
            skip_password_checks=True,
        )
        clerk_id = str(new_user.id)
        action = "created"

    session_factory = _sync_session()
    with session_factory() as session:
        row = session.execute(select(User).where(User.email == email_norm)).scalar_one_or_none()
        name_json = name.model_dump(mode="json")
        if row is None:
            session.add(
                User(
                    email=email_norm,
                    name=name_json,
                    auth_id=clerk_id,
                    auth_provider=AuthProvider.CLERK,
                    role=role,
                    gender=Gender.UNDISCLOSED,
                    verified=True,
                ),
            )
            session.commit()
        else:
            row.email = email_norm
            row.auth_id = clerk_id
            row.role = role
            row.name = name_json
            row.auth_provider = AuthProvider.CLERK
            session.add(row)
            session.commit()

    return clerk_id, action

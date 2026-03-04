"""Bootstrap admin user: ensure admin@admin.com exists in Clerk and DB.

- If user exists in Clerk: use their email, name, clerk id; ensure role=admin, type=individual; sync to DB.
- If not in Clerk: create user in Clerk with password, set role=admin and type=individual; create in DB.

Run from repo root: python scripts/bootstrap/admin.py
Requires: .env with CLERK_SECRET_KEY, DATABASE_*.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Load root .env before other imports that need env
ROOT = Path(__file__).resolve().parent.parent.parent
_env_file = ROOT / ".env"
if _env_file.exists():
    for raw in _env_file.read_text().splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())

sys.path.insert(0, str(ROOT))

from clerk_backend_api import Clerk
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from src.enums.auth import AuthProvider, ClerkRole
from src.models.user.user import User

ADMIN_EMAIL = "admin@admin.com"
ADMIN_PASSWORD = "audiobook@admin@123"  # noqa: S105
ADMIN_FIRST = "Admin"
ADMIN_LAST = "User"
PUBLIC_METADATA = {"role": "admin", "type": "individual"}


def get_sync_engine():
    user = os.environ["DATABASE_USER"]
    password = os.environ["DATABASE_PASSWORD"]
    host = os.environ["DATABASE_HOST"]
    port = os.environ["DATABASE_PORT"]
    name = os.environ["DATABASE_NAME"]
    url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"
    return create_engine(url)


def get_clerk_user(clerk: Clerk, email: str):
    """Return Clerk user if found by email, else None."""
    try:
        resp = clerk.users.list(email_address=[email], limit=1)
        data = getattr(resp, "data", None) or getattr(resp, "result", None)
        if data and len(data) > 0:
            return data[0]
        return None
    except Exception:
        return None


def ensure_clerk_admin(clerk: Clerk) -> tuple[str, str, str]:
    """Ensure admin user exists in Clerk with role=admin, type=individual. Return (clerk_id, first_name, last_name)."""
    existing = get_clerk_user(clerk, ADMIN_EMAIL)
    if existing:
        user_id = getattr(existing, "id", None) or existing.id
        first_name = getattr(existing, "first_name", None) or ADMIN_FIRST
        last_name = getattr(existing, "last_name", None) or ADMIN_LAST
        try:
            clerk.users.update_metadata(user_id, public_metadata=PUBLIC_METADATA)
        except Exception:
            pass
        return (user_id, first_name, last_name)
    # Create in Clerk (skip_password_checks=True allows bootstrap password in dev)
    try:
        new_user = clerk.users.create(
            email_address=[ADMIN_EMAIL],
            first_name=ADMIN_FIRST,
            last_name=ADMIN_LAST,
            password=ADMIN_PASSWORD,
            public_metadata=PUBLIC_METADATA,
            skip_password_checks=True,
        )
    except TypeError:
        new_user = clerk.users.create(
            email_address=[ADMIN_EMAIL],
            first_name=ADMIN_FIRST,
            last_name=ADMIN_LAST,
            password=ADMIN_PASSWORD,
            public_metadata=PUBLIC_METADATA,
            skip_password_checks=True,
        )
    return (getattr(new_user, "id", new_user.id), ADMIN_FIRST, ADMIN_LAST)


def main() -> None:
    if not os.environ.get("CLERK_SECRET_KEY"):
        print("Error: CLERK_SECRET_KEY not set in .env", file=sys.stderr)
        sys.exit(1)

    clerk = Clerk(bearer_auth=os.environ["CLERK_SECRET_KEY"])
    clerk_id, first_name, last_name = ensure_clerk_admin(clerk)
    print(
        f"Clerk admin OK: id={clerk_id} email={ADMIN_EMAIL} name={first_name} {last_name}",
    )

    engine = get_sync_engine()
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)

    with session_factory() as session:
        stmt = select(User).where(User.email == ADMIN_EMAIL)
        user = session.execute(stmt).scalars().one_or_none()
        if user:
            if user.role != ClerkRole.ADMIN or user.external_auth_id != clerk_id:
                user.role = ClerkRole.ADMIN
                user.external_auth_id = clerk_id
                user.first_name = first_name
                user.last_name = last_name
                session.add(user)
                session.commit()
                print("DB: admin user updated.")
            else:
                print("DB: admin user already exists.")
        else:
            new_user = User(
                email=ADMIN_EMAIL,
                first_name=first_name,
                last_name=last_name,
                external_auth_id=clerk_id,
                auth_provider=AuthProvider.CLERK,
                role=ClerkRole.ADMIN,
                verified=True,
            )
            session.add(new_user)
            session.commit()
            print("DB: admin user created.")

    print("Done.")


if __name__ == "__main__":
    main()

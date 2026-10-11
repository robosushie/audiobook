"""Shared Clerk + DB bootstrap helpers."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any
from uuid import UUID, uuid4

from clerk_backend_api import Clerk
from clerk_backend_api.models.clerkerrors import ClerkErrors
from clerk_backend_api.models.getuserlistop import GetUserListRequest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from src.enums.auth import AuthProvider, AuthRole
from src.enums.content import BookCategory
from src.enums.language import Language
from src.enums.user import Gender
from src.lib.feature.book.content import upload_cover, upload_manuscript
from src.lib.schemas.common import UserName
from src.models.content.book import Book
from src.models.content.reference import Reference
from src.models.user.user import User

BOOTSTRAP_DIR = Path(__file__).resolve().parent
ROOT = BOOTSTRAP_DIR.parent.parent
DATA_DIR = BOOTSTRAP_DIR / "data"

DEFAULT_BOOTSTRAP_PASSWORD = "Audiobook@Bootstrap123"  # noqa: S105


def load_root_env() -> None:
    """Load repo root ``.env`` into ``os.environ`` (setdefault)."""
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for raw in env_file.read_text().splitlines():
        line = raw.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def setup_import_path() -> None:
    """Allow importing ``src`` when scripts are run directly."""
    root_str = str(ROOT)
    if root_str not in sys.path:
        sys.path.insert(0, root_str)


def load_record(filename: str) -> dict[str, Any]:
    """Load a bootstrap JSON record from ``data/<filename>``."""
    path = DATA_DIR / filename
    if not path.is_file():
        msg = f"Bootstrap data file not found: {path}"
        raise FileNotFoundError(msg)
    return json.loads(path.read_text(encoding="utf-8"))


def load_reference_records(filename: str = "reference.json") -> list[dict[str, Any]]:
    """Load reference passage records from ``data/<filename>``."""
    path = DATA_DIR / filename
    if not path.is_file():
        msg = f"Bootstrap data file not found: {path}"
        raise FileNotFoundError(msg)
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("references"), list):
        return data["references"]
    msg = f"Expected a JSON array or {{\"references\": [...]}} in {path}"
    raise ValueError(msg)


def get_sync_session_factory() -> sessionmaker[Session]:
    user = os.environ["DATABASE_USER"]
    password = os.environ["DATABASE_PASSWORD"]
    host = os.environ["DATABASE_HOST"]
    port = os.environ["DATABASE_PORT"]
    name = os.environ["DATABASE_NAME"]
    url = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"
    engine = create_engine(url)
    return sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def parse_record(record: dict[str, Any]) -> tuple[str, UserName, AuthRole, Gender, bool, dict[str, Any], str]:
    """Normalize bootstrap JSON into typed fields."""
    email = str(record["email"]).strip().lower()
    name_data = record["name"]
    name = UserName(
        first=str(name_data["first"]).strip(),
        middle=name_data.get("middle"),
        last=str(name_data["last"]).strip(),
    )
    role = AuthRole(str(record.get("role", AuthRole.REGULAR.value)))
    gender = Gender(str(record.get("gender", Gender.UNDISCLOSED.value)))
    verified = bool(record.get("verified", True))
    public_metadata = dict(record.get("public_metadata") or {"role": role.value, "type": "individual"})
    public_metadata.setdefault("role", role.value)
    password = str(record.get("password") or os.environ.get("BOOTSTRAP_PASSWORD", DEFAULT_BOOTSTRAP_PASSWORD))
    return email, name, role, gender, verified, public_metadata, password


def _user_has_email(clerk_user: Any, normalized_email: str) -> bool:
    for addr in getattr(clerk_user, "email_addresses", None) or []:
        addr_email = getattr(addr, "email_address", None) or getattr(addr, "email", None)
        if addr_email and str(addr_email).strip().lower() == normalized_email:
            return True
    return False


def _users_list_result(resp: Any) -> list[Any]:
    """``users.list`` returns a list directly; older SDK shapes used ``.data``."""
    if isinstance(resp, list):
        return resp
    data = getattr(resp, "data", None) or getattr(resp, "result", None)
    return data if isinstance(data, list) else []


def get_clerk_user(clerk: Clerk, email: str) -> Any | None:
    """Return Clerk user if found by email, else ``None``."""
    normalized = email.strip().lower()
    try:
        by_email = _users_list_result(
            clerk.users.list(
                request=GetUserListRequest(email_address=[normalized], limit=1),
            ),
        )
        if by_email:
            return by_email[0]
    except Exception:
        pass
    try:
        for user in _users_list_result(
            clerk.users.list(request=GetUserListRequest(query=normalized, limit=20)),
        ):
            if _user_has_email(user, normalized):
                return user
    except Exception:
        pass
    return None


def _is_email_taken_error(exc: BaseException) -> bool:
    if isinstance(exc, ClerkErrors):
        return any(err.code == "form_identifier_exists" for err in exc.data.errors)
    text = str(exc).lower()
    return "form_identifier_exists" in text or "email address is taken" in text


def _update_clerk_user(
    clerk: Clerk,
    clerk_id: str,
    *,
    name: UserName,
    public_metadata: dict[str, Any],
) -> None:
    """Apply bootstrap name + metadata to an existing Clerk user."""
    try:
        clerk.users.update(
            user_id=clerk_id,
            first_name=name.first,
            last_name=name.last,
            public_metadata=public_metadata,
        )
    except TypeError:
        clerk.users.update(
            user_id=clerk_id,
            first_name=name.first,
            last_name=name.last_name,
            public_metadata=public_metadata,
        )
    except Exception:
        try:
            clerk.users.update_metadata(user_id=clerk_id, public_metadata=public_metadata)
        except Exception:
            pass


def user_name_json(name: UserName) -> dict[str, Any]:
    """Serialize ``UserName`` for JSONB columns (plain ``JSONB`` has no bind adapter)."""
    return name.model_dump(mode="json")


def user_name_key(name: UserName | dict[str, Any]) -> dict[str, Any]:
    """Normalize stored or in-memory name for comparison."""
    if isinstance(name, UserName):
        return name.model_dump(mode="json")
    return dict(name)


def ensure_clerk_user(
    clerk: Clerk,
    *,
    email: str,
    name: UserName,
    password: str,
    public_metadata: dict[str, Any],
) -> tuple[str, UserName]:
    """Create or update Clerk user from bootstrap data. Return ``(clerk_id, name)`` for DB sync."""
    existing = get_clerk_user(clerk, email)
    if existing:
        clerk_id = str(getattr(existing, "id", None) or existing.id)
        _update_clerk_user(clerk, clerk_id, name=name, public_metadata=public_metadata)
        return clerk_id, name

    try:
        new_user = clerk.users.create(
            email_address=[email],
            first_name=name.first,
            last_name=name.last,
            password=password,
            public_metadata=public_metadata,
            skip_password_checks=True,
        )
    except TypeError:
        new_user = clerk.users.create(
            email_address=[email],
            first_name=name.first,
            last_name=name.last,
            password=password,
            public_metadata=public_metadata,
            skip_password_checks=True,
        )
    except Exception as exc:
        if _is_email_taken_error(exc):
            existing = get_clerk_user(clerk, email)
            if existing:
                clerk_id = str(getattr(existing, "id", None) or existing.id)
                _update_clerk_user(clerk, clerk_id, name=name, public_metadata=public_metadata)
                return clerk_id, name
        raise
    clerk_id = str(getattr(new_user, "id", new_user.id))
    return clerk_id, name


def sync_db_user(
    session: Session,
    *,
    email: str,
    name: UserName,
    clerk_id: str,
    role: AuthRole,
    gender: Gender,
    verified: bool,
) -> str:
    """Create or update DB user; return action label (``created`` | ``updated`` | ``unchanged``)."""
    by_email = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
    by_auth = session.execute(select(User).where(User.auth_id == clerk_id)).scalar_one_or_none()

    user = by_email
    if user is None:
        user = by_auth

    if user is None:
        session.add(
            User(
                email=email,
                name=user_name_json(name),
                auth_id=clerk_id,
                auth_provider=AuthProvider.CLERK,
                role=role,
                gender=gender,
                verified=verified,
            ),
        )
        session.commit()
        return "created"

    changed = False
    if user.email != email:
        user.email = email
        changed = True
    if user.auth_id != clerk_id:
        user.auth_id = clerk_id
        changed = True
    if user.role != role:
        user.role = role
        changed = True
    if user.gender != gender:
        user.gender = gender
        changed = True
    if user.verified != verified:
        user.verified = verified
        changed = True
    if user_name_key(user.name) != user_name_json(name):
        user.name = user_name_json(name)
        changed = True
    if user.auth_provider != AuthProvider.CLERK:
        user.auth_provider = AuthProvider.CLERK
        changed = True

    if changed:
        session.add(user)
        session.commit()
        return "updated"
    return "unchanged"


def bootstrap_from_file(filename: str, label: str) -> None:
    """Run full Clerk + DB bootstrap for one JSON record."""
    record = load_record(filename)
    email, name, role, gender, verified, public_metadata, password = parse_record(record)

    if not os.environ.get("CLERK_SECRET_KEY"):
        print("Error: CLERK_SECRET_KEY not set in .env", file=sys.stderr)
        sys.exit(1)

    clerk = Clerk(bearer_auth=os.environ["CLERK_SECRET_KEY"])
    clerk_id, resolved_name = ensure_clerk_user(
        clerk,
        email=email,
        name=name,
        password=password,
        public_metadata=public_metadata,
    )
    print(
        f"Clerk {label} OK: id={clerk_id} email={email} name={resolved_name.full} role={role.value}",
    )

    session_factory = get_sync_session_factory()
    with session_factory() as session:
        action = sync_db_user(
            session,
            email=email,
            name=resolved_name,
            clerk_id=clerk_id,
            role=role,
            gender=gender,
            verified=verified,
        )
        print(f"DB {label}: user {action}.")


def sync_reference(session: Session, *, text: str, language: Language) -> str:
    """Create reference row if text+language pair is missing. Return action label."""
    normalized = text.strip()
    existing = session.execute(
        select(Reference).where(
            Reference.text == normalized,
            Reference.language == language,
        ),
    ).scalar_one_or_none()
    if existing is not None:
        return "unchanged"
    session.add(Reference(text=normalized, language=language))
    session.commit()
    return "created"


def load_book_records(filename: str = "books.json") -> list[dict[str, Any]]:
    """Load catalogue book records from ``data/<filename>``."""
    path = DATA_DIR / filename
    if not path.is_file():
        msg = f"Bootstrap data file not found: {path}"
        raise FileNotFoundError(msg)
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and isinstance(data.get("books"), list):
        return data["books"]
    msg = f'Expected a JSON array or {{"books": [...]}} in {path}'
    raise ValueError(msg)


def _author_json(record: dict[str, Any]) -> dict[str, str | None]:
    """Serialize a bootstrap author object for the books JSONB column."""
    author = record["author"]
    middle = author.get("middle")
    return UserName(
        first=str(author["first"]).strip(),
        middle=str(middle).strip() if middle else None,
        last=str(author["last"]).strip(),
    ).model_dump(mode="json")


def _upload_cover(book_id: UUID, record: dict[str, Any]) -> str | None:
    """Upload ``data/covers/<stem>-256.jpg`` and ``<stem>-1024.jpg``."""
    cover_name = record.get("cover")
    if not cover_name:
        return None
    stem = Path(str(cover_name)).stem
    thumb_path = DATA_DIR / "covers" / f"{stem}-256.jpg"
    full_path = DATA_DIR / "covers" / f"{stem}-1024.jpg"
    if not thumb_path.is_file() or not full_path.is_file():
        msg = f"Bootstrap covers not found for {stem}"
        raise FileNotFoundError(msg)
    return upload_cover(book_id, thumb_path.read_bytes(), full_path.read_bytes())


def sync_book(session: Session, record: dict[str, Any]) -> str:
    """Create or refresh one catalogue book and upload its manuscript."""
    title = str(record["title"]).strip()
    language = Language(str(record["language"]).strip().lower())
    manuscript = str(record["content"]).strip()
    if not title or not manuscript:
        msg = "Book title and content are required"
        raise ValueError(msg)

    existing = session.execute(
        select(Book).where(Book.title == title, Book.language == language),
    ).scalar_one_or_none()
    book_id = existing.id if existing is not None else uuid4()
    content_url = upload_manuscript(book_id, manuscript)
    cover_url = _upload_cover(book_id, record)
    raw_categories = record.get("categories") or []
    categories = [BookCategory(str(item).strip().lower()) for item in raw_categories]
    genre = record.get("genre")
    description = record.get("description")
    age_min = record.get("age_min")
    age_max = record.get("age_max")

    if existing is not None:
        existing.author = _author_json(record)
        existing.description = str(description).strip() if description else None
        existing.genre = str(genre).strip() if genre else None
        existing.age_min = int(age_min) if age_min is not None else None
        existing.age_max = int(age_max) if age_max is not None else None
        existing.content_url = content_url
        if cover_url is not None:
            existing.cover_url = cover_url
        existing.is_active = bool(record.get("is_active", True))
        existing.is_trending = bool(record.get("is_trending", False))
        existing.categories = categories
        session.add(existing)
        session.commit()
        return "refreshed"

    book = Book(
        id=book_id,
        title=title,
        author=_author_json(record),
        description=str(description).strip() if description else None,
        genre=str(genre).strip() if genre else None,
        language=language,
        age_min=int(age_min) if age_min is not None else None,
        age_max=int(age_max) if age_max is not None else None,
        content_url=content_url,
        cover_url=cover_url,
        is_active=bool(record.get("is_active", True)),
        is_trending=bool(record.get("is_trending", False)),
        categories=categories,
    )
    session.add(book)
    session.commit()
    return "created"


def bootstrap_books(filename: str = "books.json") -> None:
    """Seed catalogue books and upload their manuscripts (no Clerk)."""
    records = load_book_records(filename)
    session_factory = get_sync_session_factory()
    with session_factory() as session:
        for index, record in enumerate(records, start=1):
            language = str(record.get("language", "")).strip().lower()
            title = str(record.get("title", "")).strip()
            action = sync_book(session, record)
            encoding = getattr(sys.stdout, "encoding", None) or "utf-8"
            shown = title.encode(encoding, errors="replace").decode(encoding)
            print(f"  [{index}] {language} {shown}: {action}")


def bootstrap_references(filename: str = "reference.json") -> None:
    """Seed shared reference passages from JSON (no Clerk)."""
    records = load_reference_records(filename)
    session_factory = get_sync_session_factory()
    with session_factory() as session:
        for index, record in enumerate(records, start=1):
            language = Language(str(record["language"]).strip().lower())
            text = str(record["text"]).strip()
            if not text:
                print(f"  [{index}] skip: empty text for {language.value}")
                continue
            action = sync_reference(session, text=text, language=language)
            print(f"  [{index}] {language.value}: {action} ({len(text)} chars)")

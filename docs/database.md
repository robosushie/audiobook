# Database

## Stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| ORM / schema | SQLModel | Combines SQLAlchemy + Pydantic in one class definition |
| Async driver | `asyncpg` | Used by FastAPI at runtime |
| Sync driver | `psycopg2` | Used by Alembic for migrations only |
| Migrations | Alembic | Schema versioning, auto-generation from models |
| DB | PostgreSQL | Target database |

---

## Project layout

```text
src/
├── alembic/
│   ├── env.py              # Migration runner — reads all models, builds sync URL
│   ├── versions/           # Auto-generated migration files
│   └── script.py.mako
├── enums/
│   ├── auth.py             # AuthRole, AuthProvider
│   ├── billing.py          # SubscriptionPlan, SubscriptionStatus, PaymentProvider, PlanAudiobookLimit
│   └── media.py            # AudiobookStatus, VoiceProfileStatus
├── models/
│   ├── base.py             # SQLModel metadata with naming conventions
│   ├── common.py           # TimestampMixin, VerificationMixin
│   ├── __init__.py         # Imports all models — used by Alembic autogenerate
│   ├── user/
│   │   └── user.py
│   ├── content/
│   │   ├── book.py
│   │   ├── audiobook.py
│   │   └── voiceprofile.py
│   ├── player/
│   │   └── playback.py
│   └── billing/
│       ├── subscription.py
│       └── usage.py
└── lib/
    └── db.py               # Async engine, session factory, get_session() dependency
```

Subfolders do **not** have `__init__.py` files. All imports go through the root `src/models/__init__.py` directly using the full module path (e.g. `from src.models.billing.subscription import Subscription`).

---

## Two drivers, one database

Alembic cannot use `asyncpg` because it runs migrations synchronously. The codebase handles this by constructing two URLs from the same individual environment variables:

```python
# src/lib/db.py — FastAPI (async)
_async_url = f"postgresql+asyncpg://{_user}:{_password}@{_host}:{_port}/{_name}"

# src/alembic/env.py — Alembic (sync)
_sync_url = f"postgresql+psycopg2://{_user}:{_password}@{_host}:{_port}/{_name}"
```

**Never** use a single `DATABASE_URL` env var and do string `.replace()` to swap drivers — it is fragile. Build each URL explicitly from the individual `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME` variables.

---

## Environment variables

```ini
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_HOST=
DATABASE_PORT=5433
DATABASE_NAME=
```

---

## Model file structure

Every model file follows this exact class order:

```text
Base → Create → Update → Delete → Read (if needed) → table model (last)
```

The table model (`table=True`) is always the **last** class defined in the file. This matters because SQLModel resolves field inheritance at class-definition time — the non-table schemas must exist before the table class is declared.

### Example skeleton

```python
class FooBase(SQLModel):
    ...

class FooCreate(FooBase):
    ...

class FooUpdate(SQLModel):
    ...

class FooDelete(SQLModel):
    id: UUID
    deleted: bool = True

class FooRead(FooBase):      # only if needed — see below
    id: UUID

class Foo(TimestampMixin, FooBase, table=True):
    __tablename__ = "foos"
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    ...
```

---

## When to add a Read model

`Read` models are not always necessary. Add one when at least one of the following is true:

- You need to hide fields that exist on the table but should not be in API responses.
- You need to expose computed/derived fields that are not DB columns (e.g. `remaining` on `Usage`).
- You need to add FK IDs or related fields that are not in `Base`.

If `Read` would be identical to `Base + id`, skip it and return `Base` directly from the route.

---

## Timestamps and timezone

All `datetime` columns must use `TIMESTAMP WITH TIME ZONE` (`timestamptz`) in PostgreSQL. SQLModel's default `datetime` mapping produces `TIMESTAMP WITHOUT TIME ZONE`, which silently drops timezone info.

Fix this by using `sa_column` with an explicit `Column`:

```python
from sqlalchemy import Column, DateTime
from sqlmodel import Field

completed_at: datetime | None = Field(
    default=None,
    sa_column=Column(DateTime(timezone=True), nullable=True),
)
```

`TimestampMixin` and `VerificationMixin` in `src/models/common.py` already apply this to `created_at`, `updated_at`, and `verified_at` — you do not need to repeat it for those.

---

## Mixins

### `TimestampMixin` (`src/models/common.py`)

Adds `created_at` and `updated_at` with `server_default=now()` and `onupdate=now()` handled by the DB.

Apply to any table that needs audit timestamps (most tables).

### `VerificationMixin` (`src/models/common.py`)

Adds `verified: bool` and `verified_at: datetime | None`.

Apply only to `User` (or any entity that goes through an email/phone verification flow).

---

## Constraint naming conventions

Defined in `src/models/base.py` and applied globally via `SQLModel.metadata`:

| Constraint | Pattern |
| --- | --- |
| Index | `ix_<column>` |
| Unique | `uq_<table>_<column>` |
| Check | `ck_<table>_<column>` |
| Foreign key | `fk_<table>_<column>_<referred_table>` |
| Primary key | `pk_<table>` |

Alembic uses these names when generating migration SQL, which prevents anonymous constraint names that are impossible to drop later.

---

## Enums

### When to use `StrEnum` vs `IntEnum`

- **`StrEnum`** — use for any enum stored as a string column in the DB (status fields, provider names, roles). The string value is human-readable in raw SQL queries.
- **`IntEnum`** — use for enums that represent numeric quantities, like plan limits, so arithmetic works directly on the value.

```python
# StrEnum — stored as "active", "cancelled", etc.
class SubscriptionStatus(StrEnum):
    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"

# IntEnum — the value IS the limit; can be used directly in comparisons
class PlanAudiobookLimit(IntEnum):
    FREE = 5
    PRO = 25
    PREMIUM = 100

    @classmethod
    def for_plan(cls, plan: SubscriptionPlan) -> int:
        """Return the audiobook limit for the given plan."""
        return cls[plan.upper()].value
```

### Enum files

| File | Enums |
| --- | --- |
| `src/enums/auth.py` | `AuthRole`, `AuthProvider` |
| `src/enums/media.py` | `VoiceProfileStatus`, `AudiobookStatus` |
| `src/enums/billing.py` | `PaymentProvider`, `SubscriptionPlan`, `SubscriptionStatus`, `PlanAudiobookLimit` |

---

## Foreign keys vs relationships

Always define a foreign key column (`Field(foreign_key="table.id")`). This is enforced by PostgreSQL regardless of whether you add an ORM relationship.

Add a SQLAlchemy `Relationship(...)` only when you actively need to traverse the association in Python (e.g. `audiobook.user`). Do not add relationships speculatively.

### Async + relationships

With `asyncpg` and `AsyncSession`, **lazy loading does not work**. Accessing a relationship attribute without eagerly loading it raises a `MissingGreenlet` error. Always use explicit eager loading at query time:

```python
from sqlalchemy.orm import selectinload

result = await session.exec(
    select(Audiobook).options(selectinload(Audiobook.user)).where(Audiobook.id == id)
)
```

Rule of thumb: **FK first, relationship only when you feel the pain of the extra query.**

---

## Alembic workflow

```bash
# Generate a new migration from model changes
pnpm run db:make "describe the change"

# Apply all pending migrations
pnpm run db:upgrade
```

Alembic discovers tables through `src/models/__init__.py`. Every new model file **must** be imported there:

```python
# src/models/__init__.py
from src.models.user.user import User
from src.models.content.voiceprofile import VoiceProfile
# ... add new models here
```

`src/alembic/env.py` imports `src.models` as a side-effect; you never need to touch `env.py` when adding new models.

---

## Docstring rules (Ruff D401)

All function and method docstrings must open with an **imperative verb**. Ruff enforces this with rule `D401`.

| Bad | Good |
| --- | --- |
| `"Convenience constructor that resolves the limit."` | `"Resolve the limit from the plan enum and return a new instance."` |
| `"Helper for building the sync URL."` | `"Build and return the sync database URL."` |
| `"Tracks where a user left off."` | `"Track where a user left off in a specific audiobook."` |

Class docstrings are exempt — they describe what the class *is*, not what it *does*.

---

## Tables

| Table | Model file | Notes |
| --- | --- | --- |
| `users` | `user/user.py` | Auth via Clerk; `external_auth_id` stores the provider sub claim |
| `voice_profiles` | `content/voiceprofile.py` | User's cloned voice reference audio |
| `books` | `content/book.py` | Platform book catalogue |
| `audiobooks` | `content/audiobook.py` | Generated personalised audiobook per user+book+voice |
| `playbacks` | `player/playback.py` | Per-user playback position for a given audiobook |
| `subscriptions` | `billing/subscription.py` | Billing subscription; reconciled via payment provider webhooks |
| `usages` | `billing/usage.py` | Per-period generation counter; `audiobooks_limit` snapshotted at creation |

"""Alembic environment file."""

import os
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

from alembic import context

load_dotenv()

config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Override sqlalchemy.url at runtime from the environment.
# Alembic runs migrations synchronously, so we swap the asyncpg scheme for
# psycopg2 (sync driver) here.  The rest of the codebase uses asyncpg.
# ---------------------------------------------------------------------------
_user = os.environ["DATABASE_USER"]
_password = os.environ["DATABASE_PASSWORD"]
_host = os.environ["DATABASE_HOST"]
_port = os.environ["DATABASE_PORT"]
_name = os.environ["DATABASE_NAME"]

# psycopg2 (sync) — required by Alembic
_sync_url = f"postgresql+psycopg2://{_user}:{_password}@{_host}:{_port}/{_name}"

config.set_main_option("sqlalchemy.url", _sync_url)

# ---------------------------------------------------------------------------
# Import all models so their tables are registered on SQLModel.metadata.
# Add new model imports to src/models/__init__.py — this file never changes.
# ---------------------------------------------------------------------------
import src.models  # noqa: F401, E402  — side-effect import registers all tables

target_metadata = SQLModel.metadata


# ---------------------------------------------------------------------------
# Migration runners
# ---------------------------------------------------------------------------


def run_migrations_offline() -> None:
    """Emit SQL to stdout without a live DB connection (useful for dry-runs)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Connect to the DB and apply migrations."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

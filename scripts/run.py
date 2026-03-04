"""Unified CLI runner for all project scripts.

Usage (via pnpm):
    pnpm run db:create
    pnpm run db:make "migration name"
    pnpm run db:upgrade
    pnpm run app:mobile dev
    pnpm run app:web dev
    pnpm run service:api

Usage (directly):
    python scripts/run.py db:create
    python scripts/run.py db:make "migration name"
    python scripts/run.py app:mobile dev
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from typing import NoReturn

try:
    import psycopg2
    from psycopg2 import sql as pg_sql
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    _PSYCOPG2_AVAILABLE = True
except ImportError:
    _PSYCOPG2_AVAILABLE = False

ROOT = Path(__file__).parent.parent

VENV_BIN = ROOT / ".venv" / ("Scripts" if sys.platform == "win32" else "bin")
ALEMBIC = str(VENV_BIN / "alembic")
PNPM = "pnpm.cmd" if sys.platform == "win32" else "pnpm"


def load_env() -> dict[str, str]:
    """Read key=value pairs from the root .env file."""
    env: dict[str, str] = {}
    env_file = ROOT / ".env"
    if not env_file.exists():
        die(f".env file not found at {env_file}")
    for raw in env_file.read_text().splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        env[key.strip()] = value.strip()
    return env


def load_env_optional() -> dict[str, str]:
    """Read root .env if present; return empty dict otherwise."""
    env_file = ROOT / ".env"
    if not env_file.exists():
        return {}
    env: dict[str, str] = {}
    for raw in env_file.read_text().splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, value = stripped.partition("=")
        env[key.strip()] = value.strip()
    return env


def die(msg: str) -> NoReturn:
    """Print an error message to stderr and exit with code 1."""
    print(f"Error: {msg}", file=sys.stderr)
    sys.exit(1)


def run(cmd: list[str], extra_env: dict[str, str] | None = None) -> None:
    """Run a subprocess command, exit with its return code on failure.

    If extra_env is provided, it is merged with os.environ for the subprocess.
    """
    env = {**os.environ, **extra_env} if extra_env else None
    result = subprocess.run(cmd, cwd=ROOT, env=env, check=False)
    if result.returncode != 0:
        sys.exit(result.returncode)


def require_args(args: list[str], count: int, usage: str) -> None:
    """Exit with an error message if fewer than count args are provided."""
    if len(args) < count:
        print(f"Error: missing argument.\nUsage: {usage}", file=sys.stderr)
        sys.exit(1)


# ---------------------------------------------------------------------------
# Command handlers
# ---------------------------------------------------------------------------


def cmd_db_create(_args: list[str]) -> None:
    """Create the application database if it does not already exist."""
    if not _PSYCOPG2_AVAILABLE:
        die("psycopg2 is not installed. Run: .venv/Scripts/pip install psycopg2-binary")

    env = load_env()
    host = env.get("DATABASE_HOST", "localhost")
    port = env.get("DATABASE_PORT", "5432")
    user = env.get("DATABASE_USER", "postgres")
    password = env.get("DATABASE_PASSWORD", "")
    db_name = env.get("DATABASE_NAME")

    if not db_name:
        die("DATABASE_NAME is not set in .env")

    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname="postgres",
        )
    except psycopg2.OperationalError as exc:
        die(f"Could not connect to PostgreSQL: {exc}")

    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
    if cursor.fetchone():
        print(f"Database '{db_name}' already exists.")
    else:
        cursor.execute(pg_sql.SQL("CREATE DATABASE {}").format(pg_sql.Identifier(db_name)))
        print(f"Database '{db_name}' created successfully.")

    cursor.close()
    conn.close()


def cmd_db_make(args: list[str]) -> None:
    """Generate a new Alembic migration file from model changes."""
    require_args(args, 1, 'pnpm run db:make "migration name"')
    run([ALEMBIC, "revision", "--autogenerate", "-m", args[0]])


def cmd_db_upgrade(args: list[str]) -> None:
    """Apply all pending migrations to the database."""
    run([ALEMBIC, "upgrade", "head"])


def cmd_app_mobile(args: list[str]) -> None:
    """Run a pnpm script inside apps/mobile (e.g. dev, build).

    Injects root .env into the process so both web and mobile use the same env.
    """
    require_args(args, 1, "pnpm run app:mobile <script>  e.g. pnpm run app:mobile dev")
    run([PNPM, "--dir", "apps/mobile", "run", *args], extra_env=load_env_optional())


def cmd_app_web(args: list[str]) -> None:
    """Run a pnpm script inside apps/web (e.g. dev, build).

    Injects root .env into the process so both web and mobile use the same env.
    """
    require_args(args, 1, "pnpm run app:web <script>  e.g. pnpm run app:web dev")
    run([PNPM, "--dir", "apps/web", "run", *args], extra_env=load_env_optional())


def cmd_service_api(args: list[str]) -> None:
    """Start the FastAPI development server.

    Injects root .env so the API uses the same config as web/mobile.
    """
    run(
        [
            str(VENV_BIN / "uvicorn"),
            "src.services.api.app:app",
            "--reload",
            "--host",
            "0.0.0.0",
            "--port",
            "8000",
        ],
        extra_env=load_env_optional(),
    )


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

COMMANDS: dict[str, object] = {
    "db:create": cmd_db_create,
    "db:make": cmd_db_make,
    "db:upgrade": cmd_db_upgrade,
    "app:mobile": cmd_app_mobile,
    "app:web": cmd_app_web,
    "service:api": cmd_service_api,
}


def main() -> None:
    """Parse the command name and delegate to the matching handler."""
    if len(sys.argv) < 2:
        print("Available commands:", file=sys.stderr)
        for name in COMMANDS:
            print(f"  {name}", file=sys.stderr)
        sys.exit(1)

    command = sys.argv[1]
    extra_args = sys.argv[2:]

    handler = COMMANDS.get(command)
    if handler is None:
        print(f"Error: unknown command '{command}'", file=sys.stderr)
        print("Available commands:", file=sys.stderr)
        for name in COMMANDS:
            print(f"  {name}", file=sys.stderr)
        sys.exit(1)

    handler(extra_args)  # type: ignore[call-arg]


if __name__ == "__main__":
    main()

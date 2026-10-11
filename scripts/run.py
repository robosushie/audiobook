"""Unified CLI runner for all project scripts.

Usage (via pnpm at repo root):
    pnpm run dev               # Admin UI + API (API also runs the Redis worker)
    pnpm run db:create
    pnpm run db:make "migration name"
    pnpm run db:upgrade
    pnpm run app:admin        # Vite apps/admin :3001
    pnpm run service:api       # REST API :8000 (includes the Redis job worker)
    pnpm run service:cloner    # Stateless cloner HTTP API :8002
    pnpm run service:preprocess  # Stateless voice preprocess API :8003
    pnpm run infra:up          # Postgres + Redis + MinIO (localhost only)
    pnpm run deploy:stack      # build and run the full backend (GPU cloner if present)
    python scripts/bootstrap/run.py

Usage (via python — mobile / env injection):
    python scripts/run.py app:mobile dev

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
API_PORT = 8000
CLONER_PORT = 8002
PREPROCESS_PORT = 8003


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
    """Create the application database, or drop all tables if it already exists.

    After ensuring the database exists and is empty, runs Alembic migrations to
    recreate the schema.
    """
    if not _PSYCOPG2_AVAILABLE:
        die("psycopg2 is not installed. Run: .venv/Scripts/pip install psycopg2-binary")

    env = load_env()
    host = env.get("DATABASE_HOST", "localhost")
    port = env.get("DATABASE_PORT", "5433")
    user = env.get("DATABASE_USER", "postgres")
    password = env.get("DATABASE_PASSWORD", "")
    db_name = env.get("DATABASE_NAME")

    if not db_name:
        die("DATABASE_NAME is not set in .env")

    try:
        admin_conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname="postgres",
        )
    except psycopg2.OperationalError as exc:
        die(f"Could not connect to PostgreSQL: {exc}")

    admin_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    admin_cursor = admin_conn.cursor()

    admin_cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
    db_exists = admin_cursor.fetchone() is not None

    if db_exists:
        print(f"Database '{db_name}' already exists. Dropping all tables...")
        admin_cursor.close()
        admin_conn.close()

        try:
            target_conn = psycopg2.connect(
                host=host,
                port=port,
                user=user,
                password=password,
                dbname=db_name,
            )
        except psycopg2.OperationalError as exc:
            die(f"Could not connect to '{db_name}': {exc}")

        target_conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        target_cursor = target_conn.cursor()
        target_cursor.execute("DROP SCHEMA public CASCADE")
        target_cursor.execute("CREATE SCHEMA public")
        target_cursor.execute(
            pg_sql.SQL("GRANT ALL ON SCHEMA public TO {}").format(
                pg_sql.Identifier(user),
            ),
        )
        target_cursor.execute("GRANT ALL ON SCHEMA public TO public")
        target_cursor.close()
        target_conn.close()
        print(f"All tables in '{db_name}' dropped.")
    else:
        admin_cursor.execute(
            pg_sql.SQL("CREATE DATABASE {}").format(pg_sql.Identifier(db_name)),
        )
        admin_cursor.close()
        admin_conn.close()
        print(f"Database '{db_name}' created successfully.")

    print("Running migrations to recreate tables...")
    run([ALEMBIC, "upgrade", "head"])


def cmd_db_make(args: list[str]) -> None:
    """Generate a new Alembic migration file from model changes."""
    require_args(args, 1, 'pnpm run db:make "migration name"')
    run([ALEMBIC, "revision", "--autogenerate", "-m", args[0]])


def cmd_db_upgrade(args: list[str]) -> None:
    """Apply all pending migrations to the database."""
    run([ALEMBIC, "upgrade", "head"])


def _run_pnpm_in_app(app_dir: str, args: list[str]) -> None:
    """Run `pnpm run <script>` with cwd set to apps/<app_dir>."""
    app_root = ROOT / "apps" / app_dir
    if not app_root.is_dir():
        die(f"app directory not found: {app_root}")
    env = {**os.environ, **load_env_optional()}
    result = subprocess.run([PNPM, "run", *args], cwd=app_root, env=env, check=False)
    if result.returncode != 0:
        sys.exit(result.returncode)


def cmd_app_mobile(args: list[str]) -> None:
    """Run a pnpm script inside apps/mobile (e.g. dev, build).

    Injects root .env into the process so the app uses the same env.
    """
    require_args(
        args, 1, "python scripts/run.py app:mobile <script>  e.g. app:mobile dev",
    )
    _run_pnpm_in_app("mobile", args)


def cmd_app_admin(args: list[str]) -> None:
    """Run a pnpm script inside apps/admin (e.g. dev, build)."""
    require_args(args, 1, "python scripts/run.py app:admin <script>  e.g. app:admin dev")
    _run_pnpm_in_app("admin", args)


def cmd_bootstrap(_args: list[str]) -> None:
    """Bootstrap Clerk + DB users and reference passages from scripts/bootstrap/data/*.json."""
    run(
        [sys.executable, str(ROOT / "scripts" / "bootstrap" / "run.py")],
        extra_env=load_env_optional(),
    )


def cmd_service_api(args: list[str]) -> None:
    """Start the FastAPI development server.

    Injects root .env so the API uses the same config as web/mobile.
    """
    env = load_env_optional()
    env.setdefault("PREPROCESS_BASE_URL", f"http://127.0.0.1:{PREPROCESS_PORT}")
    env.setdefault("CLONER_BASE_URL", f"http://127.0.0.1:{CLONER_PORT}")
    run(
        [
            str(VENV_BIN / "uvicorn"),
            "src.services.api.app:app",
            "--host",
            "0.0.0.0",
            "--port",
            str(API_PORT),
        ],
        extra_env=env,
    )


def cmd_infra_up(_args: list[str]) -> None:
    """Start Postgres, Redis, and MinIO. App containers stay behind the stack profile."""
    run(["docker", "compose", "up", "-d"])


def _gpu_available() -> bool:
    """Return whether nvidia-smi runs successfully on the host."""
    try:
        result = subprocess.run(
            ["nvidia-smi"],
            cwd=ROOT,
            capture_output=True,
            check=False,
        )
    except OSError:
        return False
    return result.returncode == 0


def cmd_deploy_stack(_args: list[str]) -> None:
    """Build and start the full backend. The cloner gets a GPU only when one is present."""
    compose = ["docker", "compose", "-f", "docker-compose.yml"]
    if _gpu_available():
        print("GPU detected; starting the cloner with GPU access")
        compose.extend(["-f", "docker-compose.gpu.yml"])
    else:
        print("No GPU detected; starting the cloner on CPU")
    run(
        [*compose, "--profile", "stack", "build"],
        extra_env={"COMPOSE_PARALLEL_LIMIT": "1"},
    )
    run([*compose, "--profile", "stack", "up", "-d"])
    print("API            http://127.0.0.1:8000")
    print("MinIO console  http://127.0.0.1:9001")


def cmd_service_cloner(args: list[str]) -> None:
    """Start the stateless cloner HTTP API (no Postgres / Redis)."""
    env = load_env_optional()
    run(
        [
            str(VENV_BIN / "uvicorn"),
            "src.services.cloner.app:app",
            "--host",
            "0.0.0.0",
            "--port",
            str(CLONER_PORT),
            *args,
        ],
        extra_env=env,
    )


def cmd_service_preprocess(args: list[str]) -> None:
    """Start the stateless voice-preprocess HTTP API (no Postgres / Redis)."""
    env = load_env_optional()
    env.setdefault("PREPROCESS_DEVICE", "cpu")
    env.setdefault("PREPROCESS_BASE_URL", f"http://127.0.0.1:{PREPROCESS_PORT}")
    run(
        [
            str(VENV_BIN / "uvicorn"),
            "src.services.preprocess.app:app",
            "--host",
            "0.0.0.0",
            "--port",
            str(PREPROCESS_PORT),
            *args,
        ],
        extra_env=env,
    )


# ---------------------------------------------------------------------------
# Dispatch table
# ---------------------------------------------------------------------------

COMMANDS: dict[str, object] = {
    "db:create": cmd_db_create,
    "db:make": cmd_db_make,
    "db:upgrade": cmd_db_upgrade,
    "app:mobile": cmd_app_mobile,
    "app:admin": cmd_app_admin,
    "bootstrap": cmd_bootstrap,
    "infra:up": cmd_infra_up,
    "deploy:stack": cmd_deploy_stack,
    "service:api": cmd_service_api,
    "service:cloner": cmd_service_cloner,
    "service:preprocess": cmd_service_preprocess,
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

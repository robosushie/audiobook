"""Wait for Postgres, apply migrations, then start the API."""

from __future__ import annotations

import logging
import os
import shutil
import socket
import subprocess
import time

logger = logging.getLogger(__name__)


def wait_for_postgres() -> None:
    """Block until the database accepts TCP connections."""
    host = os.environ["DATABASE_HOST"]
    port = int(os.environ["DATABASE_PORT"])
    deadline = time.monotonic() + 60
    while time.monotonic() < deadline:
        try:
            with socket.create_connection((host, port), timeout=2):
                return
        except OSError:
            time.sleep(1)
    logger.error("postgres not ready")
    raise SystemExit(1)


def main() -> None:
    """Migrate, then replace this process with uvicorn."""
    wait_for_postgres()
    alembic = shutil.which("alembic")
    uvicorn = shutil.which("uvicorn")
    if alembic is None or uvicorn is None:
        logger.error("alembic or uvicorn is not on PATH")
        raise SystemExit(1)
    subprocess.check_call([alembic, "upgrade", "head"])  # noqa: S603
    os.execvp(  # noqa: S606
        uvicorn,
        [
            uvicorn,
            "src.services.api.app:app",
            "--host",
            "0.0.0.0",  # noqa: S104
            "--port",
            "8000",
        ],
    )


if __name__ == "__main__":
    main()

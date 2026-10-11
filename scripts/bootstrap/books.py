"""Bootstrap catalogue books from ``data/books.json``.

Run from repo root: python scripts/bootstrap/books.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_BOOTSTRAP = Path(__file__).resolve().parent
_ROOT = _BOOTSTRAP.parent.parent
sys.path[:0] = [str(_BOOTSTRAP), str(_ROOT)]

import _lib  # noqa: E402


def main() -> None:
    """Load env and seed catalogue books from ``data/books.json``."""
    _lib.load_root_env()
    _lib.setup_import_path()
    print("Seeding catalogue books...")
    _lib.bootstrap_books()
    print("Book bootstrap done.")


if __name__ == "__main__":
    main()

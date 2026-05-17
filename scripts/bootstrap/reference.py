"""Bootstrap shared reference passages from ``data/reference.json``.

Run from repo root: python scripts/bootstrap/reference.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_BOOTSTRAP = Path(__file__).resolve().parent
_ROOT = _BOOTSTRAP.parent.parent
sys.path[:0] = [str(_BOOTSTRAP), str(_ROOT)]

import _lib  # noqa: E402


def main() -> None:
    _lib.load_root_env()
    _lib.setup_import_path()
    print("Seeding reference passages…")
    _lib.bootstrap_references()
    print("Reference bootstrap done.")


if __name__ == "__main__":
    main()

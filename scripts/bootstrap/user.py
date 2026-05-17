"""Bootstrap regular user from ``data/user.json``.

Run from repo root: python scripts/bootstrap/user.py
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
    _lib.bootstrap_from_file("user.json", label="user")
    print("User bootstrap done.")


if __name__ == "__main__":
    main()

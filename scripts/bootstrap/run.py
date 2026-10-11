"""Bootstrap users, reference passages, and catalogue books from JSON data.

Run from repo root: python scripts/bootstrap/run.py
"""

from __future__ import annotations

import sys
from pathlib import Path

_BOOTSTRAP = Path(__file__).resolve().parent
_ROOT = _BOOTSTRAP.parent.parent
sys.path[:0] = [str(_BOOTSTRAP), str(_ROOT)]

import admin  # noqa: E402
import books  # noqa: E402
import reference  # noqa: E402
import user  # noqa: E402


def main() -> None:
    print("=== Bootstrap admin ===")
    admin.main()
    print()
    print("=== Bootstrap user ===")
    user.main()
    print()
    print("=== Bootstrap references ===")
    reference.main()
    print()
    print("=== Bootstrap books ===")
    books.main()
    print()
    print("All bootstrap steps finished.")


if __name__ == "__main__":
    main()

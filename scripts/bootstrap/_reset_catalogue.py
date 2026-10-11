"""Delete catalogue books, audiobooks, and their storage."""

from __future__ import annotations

import sys
from pathlib import Path

_BOOTSTRAP = Path(__file__).resolve().parent
_ROOT = _BOOTSTRAP.parent.parent
sys.path[:0] = [str(_BOOTSTRAP), str(_ROOT)]

import _lib  # noqa: E402
from sqlalchemy import delete, func, select  # noqa: E402

_lib.load_root_env()
_lib.setup_import_path()

from src.lib.module.storage.s3 import AUDIOBOOK_BUCKET, BOOK_BUCKET, _client  # noqa: E402
from src.models.content.audiobook import Audiobook  # noqa: E402
from src.models.content.book import Book  # noqa: E402
from src.models.content.review import Review  # noqa: E402
from src.models.player.playback import Playback  # noqa: E402


def _wipe_bucket(bucket: str) -> int:
    client = _client()
    removed = 0
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=bucket):
        objects = [{"Key": item["Key"]} for item in page.get("Contents", [])]
        if not objects:
            continue
        client.delete_objects(Bucket=bucket, Delete={"Objects": objects})
        removed += len(objects)
    return removed


def main() -> None:
    session_factory = _lib.get_sync_session_factory()
    with session_factory() as session:
        before = {
            model.__tablename__: int(session.scalar(select(func.count()).select_from(model)) or 0)
            for model in (Playback, Review, Audiobook, Book)
        }
        session.execute(delete(Playback))
        session.execute(delete(Review))
        session.execute(delete(Audiobook))
        session.execute(delete(Book))
        session.commit()
    print("deleted", before)
    print(
        "storage",
        {
            BOOK_BUCKET: _wipe_bucket(BOOK_BUCKET),
            AUDIOBOOK_BUCKET: _wipe_bucket(AUDIOBOOK_BUCKET),
        },
    )


if __name__ == "__main__":
    main()

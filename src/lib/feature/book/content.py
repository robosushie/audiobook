"""Book manuscript upload to object storage."""

from uuid import UUID

from src.lib.module.storage.local import upload_book_content, upload_book_cover


def upload_manuscript(book_id: UUID, text: str) -> str:
    """Store UTF-8 manuscript in BOOK_BUCKET; return the storage key."""
    return upload_book_content(book_id, text.encode("utf-8"))


def upload_cover(book_id: UUID, thumb: bytes, full: bytes | None = None) -> str:
    """Store thumb and full JPEG covers. Return the thumb storage key."""
    if full is not None:
        upload_book_cover(book_id, full, size="full")
    return upload_book_cover(book_id, thumb, size="thumb")

"""Book manuscript upload to object storage."""

from uuid import UUID

from src.lib.module.storage.supabase import upload_book_content


def upload_manuscript(book_id: UUID, text: str) -> str:
    """Store UTF-8 manuscript in BOOK_BUCKET; return public content_url."""
    return upload_book_content(book_id, text.encode("utf-8"))

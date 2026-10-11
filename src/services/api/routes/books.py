"""Books API routes. Admin: full CRUD. Regular users: read only."""

import asyncio
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.auth import AuthRole
from src.enums.language import Language
from src.lib.auth.clerk import create_authorization
from src.lib.db import get_session
from src.lib.feature.book.content import upload_manuscript
from src.lib.module.storage.local import download_book_content, download_book_cover
from src.lib.schemas.book import BookContentRead
from src.lib.schemas.common import UserName
from src.lib.schemas.page import Page
from src.models.content.book import Book, BookCreate, BookRead, BookUpdate

TAG = "Books"
router = APIRouter(prefix="/books", tags=[TAG])
public_router = APIRouter(prefix="/books", tags=[TAG])

auth_admin = create_authorization(required_roles={AuthRole.ADMIN})


def _author_json(
    *,
    first: str,
    last: str,
    middle: str | None = None,
) -> dict[str, str | None]:
    """Serialize author for JSONB storage (plain dict, not UserName instance)."""
    return UserName(first=first, middle=middle, last=last).model_dump(mode="json")


def _like_pattern(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


@router.get("", name="List books (no slash)", response_model=Page[BookRead], include_in_schema=False)
@router.get("/", name="List books", response_model=Page[BookRead])
async def list_books(
    trending: bool | None = Query(default=None, description="When true, only trending catalogue books"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=8, ge=1, le=50),
    q: str | None = Query(default=None, description="Match title or author"),
    genre: list[str] = Query(default=[]),
    language: list[Language] = Query(default=[]),
    active_only: bool = Query(default=True),
    session: AsyncSession = Depends(get_session),
) -> Page[BookRead]:
    """List catalogue books. Allowed for admin and regular users."""
    filters = []
    if active_only:
        filters.append(Book.is_active == True)  # noqa: E712
    if trending is True:
        filters.append(Book.is_trending == True)  # noqa: E712
    if genre:
        filters.append(Book.genre.in_(genre))
    if language:
        filters.append(Book.language.in_(language))
    query_text = (q or "").strip()
    if query_text:
        pattern = _like_pattern(query_text)
        filters.append(
            or_(
                Book.title.ilike(pattern, escape="\\"),
                Book.author["first"].as_string().ilike(pattern, escape="\\"),
                Book.author["last"].as_string().ilike(pattern, escape="\\"),
            )
        )
    total = int(await session.scalar(select(func.count()).select_from(Book).where(*filters)) or 0)
    result = await session.execute(
        select(Book)
        .where(*filters)
        .order_by(Book.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    books = result.scalars().all()
    return Page(
        items=[BookRead.model_validate(b) for b in books],
        page=page,
        page_size=page_size,
        total=total,
    )


@public_router.get("/{book_id}/cover", name="Get book cover")
async def get_book_cover(
    book_id: UUID,
    size: str = Query(default="thumb", pattern="^(thumb|full)$"),
    session: AsyncSession = Depends(get_session),
) -> Response:
    """Stream a catalogue cover. ``thumb`` is 256px, ``full`` is 1024px."""
    result = await session.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book or not book.cover_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book cover not found")
    cover = book.cover_url.strip()
    if cover.startswith(("http://", "https://")):
        return RedirectResponse(cover)
    try:
        data = await asyncio.to_thread(download_book_cover, book_id, size)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    media_type = "image/png" if data[:8] == b"\x89PNG\r\n\x1a\n" else "image/jpeg"
    return Response(content=data, media_type=media_type)


@router.get("/{book_id}", name="Get book", response_model=BookRead)
async def get_book(
    book_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> BookRead:
    """Get a book by id. Allowed for admin and regular users."""
    result = await session.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    return BookRead.model_validate(book)


@router.post("/", name="Create book", response_model=BookRead, status_code=status.HTTP_201_CREATED)
async def create_book(
    body: BookCreate,
    _: None = Depends(auth_admin),
    session: AsyncSession = Depends(get_session),
) -> BookRead:
    """Create a book. Admin only."""
    book = Book.model_validate(body)
    if isinstance(book.author, UserName):
        book.author = book.author.model_dump(mode="json")
    session.add(book)
    await session.flush()
    await session.refresh(book)
    return BookRead.model_validate(book)


@router.post(
    "/with-content",
    name="Create book with manuscript",
    response_model=BookRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_book_with_content(
    title: str = Form(..., description="Book title"),
    author_first: str = Form(..., description="Author first name"),
    author_last: str = Form(..., description="Author last name"),
    author_middle: str | None = Form(None, description="Author middle name"),
    language: Language = Form(..., description="Book language"),
    content: str = Form(..., description="Manuscript text (stored in object storage, not the DB)"),
    genre: str | None = Form(None),
    cover_url: str | None = Form(None),
    _: None = Depends(auth_admin),
    session: AsyncSession = Depends(get_session),
) -> BookRead:
    """Create a book and upload manuscript to BOOK_BUCKET; only content_url is persisted."""
    manuscript = content.strip()
    if not manuscript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content is required",
        )
    book_id = uuid4()
    try:
        content_url = upload_manuscript(book_id, manuscript)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload book content: {exc}",
        ) from exc
    book = Book(
        id=book_id,
        title=title.strip(),
        author=_author_json(
            first=author_first.strip(),
            middle=author_middle.strip() if author_middle and author_middle.strip() else None,
            last=author_last.strip(),
        ),
        genre=genre.strip() if genre and genre.strip() else None,
        language=language,
        cover_url=cover_url.strip() if cover_url and cover_url.strip() else None,
        content_url=content_url,
        is_active=True,
        is_trending=False,
        categories=[],
    )
    session.add(book)
    await session.flush()
    await session.refresh(book)
    return BookRead.model_validate(book)


@router.get("/{book_id}/content", name="Get book manuscript", response_model=BookContentRead)
async def get_book_content(
    book_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> BookContentRead:
    """Fetch manuscript text from object storage for catalogue reading."""
    result = await session.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if not book.content_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book has no manuscript content",
        )
    try:
        text = await asyncio.to_thread(
            lambda: download_book_content(book_id).decode("utf-8"),
        )
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return BookContentRead(content=text)


@router.put("/{book_id}/content", name="Update book manuscript", response_model=BookRead)
async def update_book_content(
    book_id: UUID,
    content: str = Form(..., description="Manuscript text (stored in object storage)"),
    _: None = Depends(auth_admin),
    session: AsyncSession = Depends(get_session),
) -> BookRead:
    """Replace manuscript in BOOK_BUCKET and update content_url. Admin only."""
    manuscript = content.strip()
    if not manuscript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content is required",
        )
    result = await session.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    try:
        book.content_url = upload_manuscript(book_id, manuscript)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to upload book content: {exc}",
        ) from exc
    await session.flush()
    await session.refresh(book)
    return BookRead.model_validate(book)


@router.put("/{book_id}", name="Update book", response_model=BookRead)
async def update_book(
    book_id: UUID,
    body: BookUpdate,
    _: None = Depends(auth_admin),
    session: AsyncSession = Depends(get_session),
) -> BookRead:
    """Update a book. Admin only."""
    result = await session.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    update_data = body.model_dump(exclude_unset=True, mode="json")
    if isinstance(update_data.get("author"), UserName):
        update_data["author"] = update_data["author"].model_dump(mode="json")
    for key, value in update_data.items():
        setattr(book, key, value)
    await session.flush()
    await session.refresh(book)
    return BookRead.model_validate(book)


@router.delete("/{book_id}", name="Delete book", status_code=status.HTTP_204_NO_CONTENT)
async def delete_book(
    book_id: UUID,
    _: None = Depends(auth_admin),
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a book. Admin only."""
    result = await session.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    await session.delete(book)
    # session.commit is called by get_session after yield
    return None

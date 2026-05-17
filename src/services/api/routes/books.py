"""Books API routes. Admin: full CRUD. Regular users: read only."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.auth import AuthRole
from src.lib.auth.clerk import create_authorization
from src.lib.db import get_session
from src.models.content.book import Book, BookCreate, BookRead, BookUpdate

TAG = "Books"
router = APIRouter(prefix="/books", tags=[TAG])

auth_admin = create_authorization(required_roles={AuthRole.ADMIN})


@router.get("", name="List books (no slash)", response_model=list[BookRead], include_in_schema=False)
@router.get("/", name="List books", response_model=list[BookRead])
async def list_books(
    session: AsyncSession = Depends(get_session),
) -> list[BookRead]:
    """List all books. Allowed for admin and regular users."""
    result = await session.execute(select(Book).order_by(Book.created_at.desc()))
    books = result.scalars().all()
    return [BookRead.model_validate(b) for b in books]


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
    session.add(book)
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
    update_data = body.model_dump(exclude_unset=True)
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

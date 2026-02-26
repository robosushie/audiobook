"""Book models - table + Pydantic read/write variants."""

from uuid import UUID, uuid4

from sqlalchemy import ARRAY, Column, Index
from sqlalchemy import Enum as SAEnum
from sqlmodel import Field, SQLModel
from src.enums.content import BookCategory
from src.models.common import TimestampMixin


class BookBase(SQLModel):
    """Fields shared by all book schemas."""

    title: str = Field(max_length=256)
    author: str = Field(max_length=256)
    description: str | None = None
    cover_url: str | None = Field(default=None, max_length=2048)
    genre: str | None = Field(default=None, max_length=64)
    language: str = Field(max_length=16)
    age_min: int | None = Field(default=None, ge=0)
    age_max: int | None = Field(default=None, ge=0)
    content_url: str | None = Field(default=None, max_length=2048)
    is_active: bool = Field(default=True)
    is_trending: bool = Field(default=False)
    average_rating: float | None = Field(default=None, ge=0.0, le=5.0)
    rating_count: int = Field(default=0, ge=0)
    categories: list[BookCategory] = Field(default_factory=list)


class BookCreate(BookBase):
    """Payload for adding a new book to the catalogue."""


class BookUpdate(SQLModel):
    """PATCH-safe update fields."""

    title: str | None = None
    author: str | None = None
    description: str | None = None
    cover_url: str | None = None
    genre: str | None = None
    language: str | None = None
    age_min: int | None = None
    age_max: int | None = None
    content_url: str | None = None
    is_active: bool | None = None
    is_trending: bool | None = None
    average_rating: float | None = Field(default=None, ge=0.0, le=5.0)
    rating_count: int | None = Field(default=None, ge=0)
    categories: list[BookCategory] | None = None


class BookDelete(SQLModel):
    """Confirmation payload returned after deleting a book."""

    id: UUID
    deleted: bool = True


class BookRead(BookBase):
    """API response representation of a book."""

    id: UUID


class Book(TimestampMixin, BookBase, table=True):
    """Catalogue entry for a book available on the platform."""

    __tablename__ = "books"
    __table_args__ = (
        Index(
            "ix_books_categories",
            "categories",
            postgresql_using="gin",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    categories: list[BookCategory] = Field(
        default_factory=list,
        sa_column=Column(
            ARRAY(SAEnum(BookCategory, name="bookcategory")),
            default=list,
            nullable=False,
        ),
    )

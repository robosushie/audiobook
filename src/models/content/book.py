"""Book models — table + Pydantic read/write variants."""

from uuid import UUID, uuid4

from sqlalchemy import ARRAY, Column, Index, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel
from src.constants.model import ORM_METADATA
from src.enums.content import BookCategory
from src.enums.language import Language
from src.lib.schemas.common import UserName
from src.models.common import TimestampMixin


class BookBase(SQLModel):
    """Fields shared by all book schemas."""

    title: str = Field(max_length=256)
    author: UserName
    description: str | None = None
    cover_url: str | None = Field(default=None, max_length=2048)
    genre: str | None = Field(default=None, max_length=64)
    language: Language = Field(sa_type=String(16))
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
    author: UserName | None = None
    description: str | None = None
    cover_url: str | None = None
    genre: str | None = None
    language: Language | None = None
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


class Book(BookBase, TimestampMixin, table=True):
    """Catalogue entry for a book available on the platform."""

    metadata = ORM_METADATA
    __tablename__ = "books"
    __table_args__ = (
        Index(
            "ix_books_categories",
            "categories",
            postgresql_using="gin",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author: UserName = Field(sa_column=Column(JSONB, nullable=False))
    categories: list[BookCategory] = Field(
        default_factory=list,
        sa_column=Column(
            ARRAY(SAEnum(BookCategory, name="bookcategory")),
            default=list,
            nullable=False,
        ),
    )

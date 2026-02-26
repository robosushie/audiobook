"""Book review models — table + Pydantic read/write variants."""

from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, UniqueConstraint
from sqlmodel import Field, SQLModel
from src.models.common import TimestampMixin


class ReviewBase(SQLModel):
    """Fields shared by all review schemas."""

    rating: int = Field(ge=1, le=5, description="Star rating 1-5")
    body: str | None = Field(default=None, max_length=2000)


class ReviewCreate(ReviewBase):
    """Payload to create a book review."""

    user_id: UUID
    book_id: UUID


class ReviewUpdate(SQLModel):
    """PATCH-safe update fields."""

    rating: int | None = Field(default=None, ge=1, le=5)
    body: str | None = Field(default=None, max_length=2000)


class ReviewDelete(SQLModel):
    """Confirmation payload returned after deleting a review."""

    id: UUID
    deleted: bool = True


class ReviewRead(ReviewBase):
    """API response representation of a review."""

    id: UUID
    user_id: UUID
    book_id: UUID


class Review(TimestampMixin, ReviewBase, table=True):
    """User review and star rating for a book — one per user per book."""

    __tablename__ = "book_reviews"
    __table_args__ = (
        UniqueConstraint("user_id", "book_id", name="uq_book_reviews_user_id_book_id"),
        CheckConstraint("rating >= 1 AND rating <= 5", name="ck_book_reviews_rating"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="users.id", index=True)
    book_id: UUID = Field(foreign_key="books.id", index=True)

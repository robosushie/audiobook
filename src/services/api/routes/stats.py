"""Dashboard stats API. Aggregated counts for admin dashboard."""

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.types import Date

from src.enums.auth import AuthRole
from src.enums.media import AudiobookStatus
from src.lib.db import get_session
from src.models.content.audiobook import Audiobook
from src.models.content.book import Book
from src.models.user.user import User

TAG = "Stats"
router = APIRouter(prefix="/stats", tags=[TAG])


class DashboardStats(BaseModel):
    total_users: int = 0
    total_books: int = 0
    audiobooks_success: int = 0
    audiobooks_in_progress: int = 0
    audiobooks_queued: int = 0
    audiobooks_failed: int = 0


class GenreCount(BaseModel):
    genre: str
    count: int


class DailyAudiobookCount(BaseModel):
    date: str
    count: int


class DashboardOverview(BaseModel):
    total_users: int = 0
    admin_users: int = 0
    regular_users: int = 0
    total_books: int = 0
    books_by_genre: list[GenreCount] = []
    audiobooks_last_30_days: list[DailyAudiobookCount] = []


@router.get("/dashboard", name="Dashboard stats", response_model=DashboardStats)
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_session),
) -> DashboardStats:
    """Return aggregated counts for the admin dashboard. Admin only."""
    users_result = await session.execute(select(func.count()).select_from(User))
    total_users = users_result.scalar() or 0

    books_result = await session.execute(select(func.count()).select_from(Book))
    total_books = books_result.scalar() or 0

    ab_result = await session.execute(
        select(Audiobook.status, func.count(Audiobook.id)).group_by(Audiobook.status),
    )
    ab_counts = dict.fromkeys(AudiobookStatus, 0)
    for row in ab_result.all():
        ab_counts[row[0]] = row[1]

    return DashboardStats(
        total_users=total_users,
        total_books=total_books,
        audiobooks_success=ab_counts.get(AudiobookStatus.COMPLETED, 0),
        audiobooks_in_progress=ab_counts.get(AudiobookStatus.PROCESSING, 0),
        audiobooks_queued=ab_counts.get(AudiobookStatus.QUEUED, 0),
        audiobooks_failed=ab_counts.get(AudiobookStatus.FAILED, 0),
    )


@router.get("/dashboard/overview", name="Dashboard overview", response_model=DashboardOverview)
async def get_dashboard_overview(
    session: AsyncSession = Depends(get_session),
) -> DashboardOverview:
    """User/book summaries and audiobook activity for the admin dashboard."""
    role_counts = await session.execute(
        select(User.role, func.count(User.id)).group_by(User.role),
    )
    counts_by_role: dict[AuthRole, int] = {AuthRole.ADMIN: 0, AuthRole.REGULAR: 0}
    for role, count in role_counts.all():
        counts_by_role[role] = count

    admin_users = counts_by_role[AuthRole.ADMIN]
    regular_users = counts_by_role[AuthRole.REGULAR]
    total_users = admin_users + regular_users

    books_result = await session.execute(select(func.count()).select_from(Book))
    total_books = books_result.scalar() or 0

    genre_rows = await session.execute(
        select(Book.genre, func.count(Book.id)).group_by(Book.genre).order_by(func.count(Book.id).desc()),
    )
    books_by_genre = [
        GenreCount(genre=row[0] or "Uncategorized", count=row[1])
        for row in genre_rows.all()
    ]

    since = datetime.now(tz=UTC) - timedelta(days=30)
    day_col = cast(Audiobook.created_at, Date)
    activity_rows = await session.execute(
        select(day_col, func.count(Audiobook.id))
        .where(Audiobook.created_at >= since)
        .group_by(day_col)
        .order_by(day_col),
    )
    counts_by_day = {row[0].isoformat(): row[1] for row in activity_rows.all() if row[0]}

    audiobooks_last_30_days: list[DailyAudiobookCount] = []
    today = datetime.now(tz=UTC).date()
    for offset in range(29, -1, -1):
        day = today - timedelta(days=offset)
        key = day.isoformat()
        audiobooks_last_30_days.append(DailyAudiobookCount(date=key, count=counts_by_day.get(key, 0)))

    return DashboardOverview(
        total_users=total_users,
        admin_users=admin_users,
        regular_users=regular_users,
        total_books=total_books,
        books_by_genre=books_by_genre,
        audiobooks_last_30_days=audiobooks_last_30_days,
    )

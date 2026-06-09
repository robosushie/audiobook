"""Playback API — listening history for the signed-in user (admin and regular users)."""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.db import get_session
from src.lib.feature.user.current import resolve_current_user
from src.lib.schemas.common import UserName
from src.models.content.audiobook import Audiobook
from src.models.content.book import Book
from src.models.player.playback import Playback, PlaybackRead, PlaybackUpdate
from src.models.user.user import User

TAG = "Playbacks"
router = APIRouter(prefix="/playbacks", tags=[TAG])


class PlaybackWithDetailsRead(PlaybackRead):
    """Playback row with book and audiobook metadata for the home feed."""

    book_id: UUID
    book_title: str
    book_cover_url: str | None = None
    book_author: UserName | None = None
    audiobook_duration: float | None = None
    audiobook_status: str | None = None
    content_url: str | None = None


@router.get(
    "/me",
    name="List my playbacks",
    response_model=list[PlaybackWithDetailsRead],
)
async def list_my_playbacks(
    request: Request,
    limit: int = Query(default=4, ge=1, le=20),
    session: AsyncSession = Depends(get_session),
) -> list[PlaybackWithDetailsRead]:
    """Recent listening history for the current user, newest first."""
    user: User = await resolve_current_user(request, session)
    result = await session.execute(
        select(Playback, Audiobook, Book)
        .join(Audiobook, Playback.audiobook_id == Audiobook.id)
        .join(Book, Audiobook.book_id == Book.id)
        .where(Playback.user_id == user.id)
        .order_by(Playback.last_played_at.desc().nullslast(), Playback.id.desc())
        .limit(limit),
    )
    out: list[PlaybackWithDetailsRead] = []
    for playback, audiobook, book in result.all():
        out.append(
            PlaybackWithDetailsRead(
                **PlaybackRead.model_validate(playback).model_dump(),
                book_id=book.id,
                book_title=book.title,
                book_cover_url=book.cover_url,
                book_author=book.author,
                audiobook_duration=audiobook.duration,
                audiobook_status=str(audiobook.status.value)
                if hasattr(audiobook.status, "value")
                else str(audiobook.status),
                content_url=audiobook.content_url,
            ),
        )
    return out


@router.put(
    "/me/{audiobook_id}",
    name="Upsert my playback",
    response_model=PlaybackWithDetailsRead,
)
async def upsert_my_playback(
    audiobook_id: UUID,
    body: PlaybackUpdate,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> PlaybackWithDetailsRead:
    """Create or update playback progress for an audiobook owned by the current user."""
    user: User = await resolve_current_user(request, session)
    ab_result = await session.execute(
        select(Audiobook, Book)
        .join(Book, Audiobook.book_id == Book.id)
        .where(Audiobook.id == audiobook_id, Audiobook.user_id == user.id),
    )
    row = ab_result.one_or_none()
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audiobook not found")
    audiobook, book = row

    pb_result = await session.execute(
        select(Playback).where(
            Playback.user_id == user.id,
            Playback.audiobook_id == audiobook_id,
        ),
    )
    playback = pb_result.scalar_one_or_none()
    now = datetime.now(UTC)
    if playback is None:
        progress = body.progress if body.progress is not None else 0.0
        playback = Playback(
            user_id=user.id,
            audiobook_id=audiobook_id,
            progress=min(max(progress, 0.0), 1.0),
            last_played_at=body.last_played_at or now,
        )
        session.add(playback)
        await session.flush()
    else:
        if body.progress is not None:
            playback.progress = min(max(body.progress, 0.0), 1.0)
        playback.last_played_at = body.last_played_at or now

    await session.refresh(playback)
    return PlaybackWithDetailsRead(
        **PlaybackRead.model_validate(playback).model_dump(),
        book_id=book.id,
        book_title=book.title,
        book_cover_url=book.cover_url,
        book_author=book.author,
        audiobook_duration=audiobook.duration,
        audiobook_status=str(audiobook.status.value)
        if hasattr(audiobook.status, "value")
        else str(audiobook.status),
        content_url=audiobook.content_url,
    )

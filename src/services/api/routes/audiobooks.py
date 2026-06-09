"""Audiobooks API routes. Full CRUD for admin and regular users."""

from datetime import datetime
from enum import Enum
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.auth import AuthRole
from src.enums.cloner import ClonerType
from src.enums.media import AudiobookStatus
from src.lib.auth.clerk import create_authorization
from src.lib.cloner.cloner import create_queued_audiobook
from src.lib.feature.audiobook.audio import AudiobookAudioNotFoundError, read_audiobook_audio_bytes
from src.lib.feature.sse.notify import publish_audiobook_row
from src.lib.db import get_session
from src.lib.feature.user.current import resolve_current_user
from src.lib.error import AUDIOBOOK_GENERATION_FAILED, VOICE_USER_NOT_FOUND
from src.lib.schemas.cloner import GenerateAudiobookRequest
from src.lib.schemas.common import UserName
from src.services.event.enqueue import enqueue_audiobook_generate
from src.models.content.audiobook import (
    Audiobook,
    AudiobookCreate,
    AudiobookRead,
    AudiobookUpdate,
)
from src.models.content.book import Book
from src.models.player.playback import Playback
from src.models.user.user import User

TAG = "Audiobooks"
router = APIRouter(prefix="/audiobooks", tags=[TAG])
_admin_auth = create_authorization(required_roles={AuthRole.ADMIN})


class GenerateAudiobookBody(BaseModel):
    """Request body to enqueue audiobook generation."""

    book_id: UUID
    voice_profile_id: UUID
    cloner_type: ClonerType | None = None


def _coerce_language_slug(value: object | None) -> str | None:
    if value is None:
        return None
    if isinstance(value, Enum):
        return str(value.value)
    return str(value)


class AudiobookWithBookRead(AudiobookRead):
    """Audiobook list item with book title and cover for display."""

    book_title: str | None = None
    book_cover_url: str | None = None
    book_author: UserName | None = None
    book_language: str | None = None
    playback_progress: float = 0.0


class AdminAudiobookListRow(AudiobookWithBookRead):
    """Admin audiobook list item with owning user details."""

    user_email: str | None = None
    user_name: UserName | None = None
    created_at: datetime


def _parse_user_name(value: object | None) -> UserName | None:
    if value is None:
        return None
    if isinstance(value, UserName):
        return value
    return UserName.model_validate(value)


def _audiobook_with_book_row(
    ab: Audiobook,
    *,
    book_title: str | None,
    book_cover_url: str | None,
    book_author: object | None,
    book_language: object | None,
    playback_progress: float = 0.0,
) -> AudiobookWithBookRead:
    return AudiobookWithBookRead(
        **AudiobookRead.model_validate(ab).model_dump(),
        book_title=book_title,
        book_cover_url=book_cover_url,
        book_author=_parse_user_name(book_author),
        book_language=_coerce_language_slug(book_language),
        playback_progress=min(max(playback_progress, 0.0), 1.0),
    )


@router.get("", name="List audiobooks (no slash)", response_model=list[AudiobookWithBookRead], include_in_schema=False)
@router.get("/", name="List audiobooks", response_model=list[AudiobookWithBookRead])
async def list_audiobooks(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[AudiobookWithBookRead]:
    """List the signed-in user's audiobooks with book details."""
    user = await resolve_current_user(request, session)
    result = await session.execute(
        select(Audiobook, Book.title, Book.cover_url, Book.author, Book.language, Playback.progress)
        .outerjoin(Book, Audiobook.book_id == Book.id)
        .outerjoin(
            Playback,
            (Playback.audiobook_id == Audiobook.id) & (Playback.user_id == user.id),
        )
        .where(Audiobook.user_id == user.id)
        .order_by(Audiobook.created_at.desc())
    )
    out: list[AudiobookWithBookRead] = []
    for row in result.all():
        ab = row[0]
        book_title = row[1] if len(row) > 1 else None
        book_cover_url = row[2] if len(row) > 2 else None
        book_author = row[3] if len(row) > 3 else None
        book_language = row[4] if len(row) > 4 else None
        playback_progress = float(row[5]) if len(row) > 5 and row[5] is not None else 0.0
        out.append(
            _audiobook_with_book_row(
                ab,
                book_title=book_title,
                book_cover_url=book_cover_url,
                book_author=book_author,
                book_language=book_language,
                playback_progress=playback_progress,
            )
        )
    return out


@router.get(
    "/admin",
    name="Admin list audiobooks",
    response_model=list[AdminAudiobookListRow],
    dependencies=[Depends(_admin_auth)],
)
async def admin_list_audiobooks(
    user_id: UUID | None = Query(default=None, description="Filter by account"),
    status: AudiobookStatus | None = Query(default=None, description="Filter by pipeline status"),
    session: AsyncSession = Depends(get_session),
) -> list[AdminAudiobookListRow]:
    """List audiobooks across all accounts. Admin only."""
    stmt = (
        select(Audiobook, Book.title, Book.cover_url, Book.author, Book.language, User.email, User.name)
        .outerjoin(Book, Audiobook.book_id == Book.id)
        .join(User, Audiobook.user_id == User.id)
        .order_by(Audiobook.created_at.desc())
    )
    if user_id is not None:
        stmt = stmt.where(Audiobook.user_id == user_id)
    if status is not None:
        stmt = stmt.where(Audiobook.status == status)

    result = await session.execute(stmt)
    out: list[AdminAudiobookListRow] = []
    for row in result.all():
        ab = row[0]
        base = _audiobook_with_book_row(
            ab,
            book_title=row[1],
            book_cover_url=row[2],
            book_author=row[3],
            book_language=row[4],
        )
        out.append(
            AdminAudiobookListRow(
                **base.model_dump(),
                user_email=row[5],
                user_name=_parse_user_name(row[6]),
                created_at=ab.created_at,
            )
        )
    return out


@router.get(
    "/admin/{audiobook_id}/audio",
    name="Admin download audiobook audio",
    dependencies=[Depends(_admin_auth)],
)
async def admin_download_audiobook_audio(
    audiobook_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> Response:
    """Return audiobook audio bytes for admin preview. Admin only."""
    result = await session.execute(select(Audiobook).where(Audiobook.id == audiobook_id))
    audiobook = result.scalar_one_or_none()
    if audiobook is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audiobook not found")
    try:
        audio_bytes = await read_audiobook_audio_bytes(
            session,
            user_id=audiobook.user_id,
            audiobook_id=audiobook_id,
        )
    except AudiobookAudioNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(content=audio_bytes, media_type="audio/wav")


@router.get("/{audiobook_id}/audio", name="Download audiobook audio")
async def download_audiobook_audio(
    audiobook_id: UUID,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> Response:
    """Return audiobook audio bytes for the signed-in owner (for app download-and-play)."""
    user = await resolve_current_user(request, session)
    try:
        audio_bytes = await read_audiobook_audio_bytes(
            session,
            user_id=user.id,
            audiobook_id=audiobook_id,
        )
    except AudiobookAudioNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return Response(content=audio_bytes, media_type="audio/wav")


@router.get("/{audiobook_id}", name="Get audiobook", response_model=AudiobookRead)
async def get_audiobook(
    audiobook_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> AudiobookRead:
    """Get an audiobook by id."""
    result = await session.execute(select(Audiobook).where(Audiobook.id == audiobook_id))
    audiobook = result.scalar_one_or_none()
    if not audiobook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audiobook not found")
    return AudiobookRead.model_validate(audiobook)


@router.post("/", name="Create audiobook", response_model=AudiobookRead, status_code=status.HTTP_201_CREATED)
async def create_audiobook(
    body: AudiobookCreate,
    session: AsyncSession = Depends(get_session),
) -> AudiobookRead:
    """Create an audiobook row without starting generation."""
    audiobook = Audiobook.model_validate(body)
    session.add(audiobook)
    await session.flush()
    await session.refresh(audiobook)
    return AudiobookRead.model_validate(audiobook)


@router.post(
    "/generate",
    name="Generate audiobook",
    response_model=AudiobookRead,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate_audiobook_endpoint(
    request: Request,
    body: GenerateAudiobookBody,
    session: AsyncSession = Depends(get_session),
) -> AudiobookRead:
    """Enqueue audiobook generation via Inngest (clone + upload)."""
    clerk_id = request.state.credentials.id
    user_result = await session.execute(select(User).where(User.auth_id == clerk_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=VOICE_USER_NOT_FOUND)
    user_id = user.id
    try:
        audiobook = await create_queued_audiobook(
            GenerateAudiobookRequest(
                voice_profile_id=body.voice_profile_id,
                book_id=body.book_id,
                user_id=user_id,
                cloner_type=body.cloner_type,
            ),
            session,
        )
        await enqueue_audiobook_generate(
            audiobook_id=audiobook.id,
            cloner_type=body.cloner_type,
        )
        book_result = await session.execute(select(Book.title, Book.cover_url).where(Book.id == audiobook.book_id))
        book_row = book_result.first()
        await publish_audiobook_row(
            audiobook,
            book_title=book_row[0] if book_row else None,
            book_cover_url=book_row[1] if book_row else None,
            event_type="audiobook.created",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=AUDIOBOOK_GENERATION_FAILED.format(error=e),
        ) from e
    return AudiobookRead.model_validate(audiobook)


@router.put("/{audiobook_id}", name="Update audiobook", response_model=AudiobookRead)
async def update_audiobook(
    audiobook_id: UUID,
    body: AudiobookUpdate,
    session: AsyncSession = Depends(get_session),
) -> AudiobookRead:
    """Update an audiobook."""
    result = await session.execute(select(Audiobook).where(Audiobook.id == audiobook_id))
    audiobook = result.scalar_one_or_none()
    if not audiobook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audiobook not found")
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(audiobook, key, value)
    await session.flush()
    await session.refresh(audiobook)
    return AudiobookRead.model_validate(audiobook)


@router.delete("/{audiobook_id}", name="Delete audiobook", status_code=status.HTTP_204_NO_CONTENT)
async def delete_audiobook(
    audiobook_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete an audiobook."""
    result = await session.execute(select(Audiobook).where(Audiobook.id == audiobook_id))
    audiobook = result.scalar_one_or_none()
    if not audiobook:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audiobook not found")
    await session.delete(audiobook)
    return None

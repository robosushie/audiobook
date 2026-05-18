"""Audiobooks API routes. Full CRUD for admin and regular users."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.cloner import ClonerType
from src.lib.cloner.cloner import create_queued_audiobook
from src.lib.db import get_session
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
from src.models.user.user import User

TAG = "Audiobooks"
router = APIRouter(prefix="/audiobooks", tags=[TAG])


class GenerateAudiobookBody(BaseModel):
    """Request body to enqueue audiobook generation."""

    book_id: UUID
    voice_profile_id: UUID
    cloner_type: ClonerType | None = None


class AudiobookWithBookRead(AudiobookRead):
    """Audiobook list item with book title and cover for display."""

    book_title: str | None = None
    book_cover_url: str | None = None
    book_author: UserName | None = None


@router.get("", name="List audiobooks (no slash)", response_model=list[AudiobookWithBookRead], include_in_schema=False)
@router.get("/", name="List audiobooks", response_model=list[AudiobookWithBookRead])
async def list_audiobooks(
    session: AsyncSession = Depends(get_session),
) -> list[AudiobookWithBookRead]:
    """List all audiobooks with book details. Allowed for admin and regular users."""
    result = await session.execute(
        select(Audiobook, Book.title, Book.cover_url, Book.author)
        .outerjoin(Book, Audiobook.book_id == Book.id)
        .order_by(Audiobook.created_at.desc())
    )
    out: list[AudiobookWithBookRead] = []
    for row in result.all():
        ab = row[0]
        book_title = row[1] if len(row) > 1 else None
        book_cover_url = row[2] if len(row) > 2 else None
        book_author = row[3] if len(row) > 3 else None
        out.append(
            AudiobookWithBookRead(
                **AudiobookRead.model_validate(ab).model_dump(),
                book_title=book_title,
                book_cover_url=book_cover_url,
                book_author=book_author,
            )
        )
    return out


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

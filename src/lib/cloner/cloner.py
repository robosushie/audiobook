"""Cloner factory and audiobook generation orchestration."""

import asyncio
from datetime import UTC, datetime
from uuid import UUID

import inngest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.constants.language import cloner_for_language
from src.enums.cloner import ClonerType
from src.enums.language import Language
from src.enums.media import AudiobookStatus, VoiceProfileStatus
from src.lib.cloner.base import VoiceCloner
from src.lib.module.storage.supabase import download_book_content
from src.lib.error import (
    BOOK_CONTENT_URL_MISSING,
    BOOK_NOT_FOUND,
    UNSUPPORTED_CLONER_TYPE,
    VOICE_AUDIO_NOT_READY,
    VOICE_PROFILE_NOT_FOUND,
)
from src.lib.feature.sse.notify import publish_audiobook_row
from src.lib.module.inngest.db import job_session
from src.lib.module.storage.supabase import (
    audiobook_object_path,
    download_voice,
    upload_audiobook,
)
from src.lib.schemas.cloner import CloneRequest, CloneResult, GenerateAudiobookRequest
from src.models.content.audiobook import Audiobook
from src.models.content.book import Book
from src.models.content.reference import Reference
from src.models.content.voice import Voice

_CLONERS: dict[ClonerType, VoiceCloner] = {}


def create_cloner(cloner_type: ClonerType) -> VoiceCloner:
    """Return a cached cloner for ``cloner_type``."""
    if cloner_type in _CLONERS:
        return _CLONERS[cloner_type]

    if cloner_type is ClonerType.INDICF5:
        from src.lib.cloner.indicf5.cloner import IndicF5Cloner

        cloner: VoiceCloner = IndicF5Cloner()
    elif cloner_type is ClonerType.XTTSV2:
        from src.lib.cloner.xttsv2.cloner import XTTSV2Cloner

        cloner = XTTSV2Cloner()
    else:
        raise ValueError(UNSUPPORTED_CLONER_TYPE.format(cloner_type=cloner_type))

    _CLONERS[cloner_type] = cloner
    return cloner


def resolve_cloner_type(
    language: Language,
    override: ClonerType | None = None,
) -> ClonerType:
    """Pick cloner from override or ``constants.language`` defaults."""
    return override if override is not None else cloner_for_language(language)


def clone_speech(
    request: CloneRequest, *, cloner_type: ClonerType | None = None
) -> CloneResult:
    """Run voice cloning and return synthesized audio."""
    backend = resolve_cloner_type(request.language, cloner_type)
    return create_cloner(backend).clone(request)


def _generate_audiobook_sync(
    *,
    voice: Voice,
    reference: Reference,
    book: Book,
    audiobook_id: UUID,
    user_id: UUID,
    cloner_type: ClonerType | None,
) -> tuple[str, float]:
    """Load processed voice audio, clone book text, upload to AUDIOBOOK_BUCKET."""
    if voice.status is not VoiceProfileStatus.READY:
        raise ValueError(VOICE_AUDIO_NOT_READY)
    if not voice.audio_url or not voice.audio_text or not voice.audio_text.strip():
        raise ValueError(VOICE_AUDIO_NOT_READY)
    if not book.content_url:
        raise ValueError(BOOK_CONTENT_URL_MISSING)

    reference_audio = download_voice(voice.user_id, voice.id)
    book_text = download_book_content(book.id).decode("utf-8").strip()
    if not book_text:
        raise ValueError(BOOK_CONTENT_URL_MISSING)

    result = clone_speech(
        CloneRequest(
            reference_audio=reference_audio,
            reference_text=voice.audio_text.strip(),
            source_text=book_text,
            language=reference.language,
        ),
        cloner_type=cloner_type,
    )

    object_path = audiobook_object_path(user_id, audiobook_id)
    content_url = upload_audiobook(
        object_path,
        result.audio_bytes,
        content_type="audio/wav",
    )
    return content_url, result.duration


async def create_queued_audiobook(
    request: GenerateAudiobookRequest,
    session: AsyncSession,
) -> Audiobook:
    """Validate inputs, create a QUEUED row (generation runs in Inngest)."""
    voice_result = await session.execute(
        select(Voice, Reference)
        .join(Reference, Voice.reference_id == Reference.id)
        .where(Voice.id == request.voice_profile_id),
    )
    voice_row = voice_result.first()
    if voice_row is None:
        raise ValueError(VOICE_PROFILE_NOT_FOUND)
    voice, _reference = voice_row[0], voice_row[1]

    if voice.status is not VoiceProfileStatus.READY:
        raise ValueError(VOICE_AUDIO_NOT_READY)

    book_result = await session.execute(select(Book).where(Book.id == request.book_id))
    book = book_result.scalar_one_or_none()
    if not book:
        raise ValueError(BOOK_NOT_FOUND)

    audiobook = Audiobook(
        user_id=request.user_id,
        book_id=request.book_id,
        voice_profile_id=request.voice_profile_id,
        status=AudiobookStatus.QUEUED,
    )
    session.add(audiobook)
    await session.flush()
    await session.refresh(audiobook)
    return audiobook


async def run_audiobook_generation_job(
    audiobook_id: UUID,
    *,
    cloner_type: ClonerType | None = None,
) -> Audiobook:
    """Clone and upload for a queued audiobook (Inngest worker)."""
    async with job_session() as session:
        result = await session.execute(
            select(Audiobook).where(Audiobook.id == audiobook_id)
        )
        audiobook = result.scalar_one_or_none()
        if not audiobook:
            raise inngest.NonRetriableError("Audiobook not found")

        if audiobook.status not in (AudiobookStatus.QUEUED, AudiobookStatus.PROCESSING):
            return audiobook

        voice_result = await session.execute(
            select(Voice, Reference)
            .join(Reference, Voice.reference_id == Reference.id)
            .where(Voice.id == audiobook.voice_profile_id),
        )
        voice_row = voice_result.first()
        if voice_row is None:
            raise inngest.NonRetriableError(VOICE_PROFILE_NOT_FOUND)
        voice, reference = voice_row[0], voice_row[1]

        book_result = await session.execute(
            select(Book).where(Book.id == audiobook.book_id)
        )
        book = book_result.scalar_one_or_none()
        if not book:
            raise inngest.NonRetriableError(BOOK_NOT_FOUND)

        audiobook.status = AudiobookStatus.PROCESSING
        await session.flush()
        await publish_audiobook_row(audiobook, book_title=book.title, book_cover_url=book.cover_url, event_type="audiobook.updated")

        try:
            content_url, duration = await asyncio.to_thread(
                _generate_audiobook_sync,
                voice=voice,
                reference=reference,
                book=book,
                audiobook_id=audiobook.id,
                user_id=audiobook.user_id,
                cloner_type=cloner_type,
            )
            audiobook.content_url = content_url
            audiobook.duration = duration
            audiobook.status = AudiobookStatus.COMPLETED
            audiobook.completed_at = datetime.now(UTC)
        except Exception:
            audiobook.status = AudiobookStatus.FAILED
            raise

        await session.flush()
        await session.refresh(audiobook)
        await publish_audiobook_row(audiobook, book_title=book.title, book_cover_url=book.cover_url, event_type="audiobook.updated")
        return audiobook


async def mark_audiobook_failed(audiobook_id: UUID) -> None:
    """Mark audiobook FAILED after exhausted retries."""
    async with job_session() as session:
        result = await session.execute(
            select(Audiobook).where(Audiobook.id == audiobook_id)
        )
        audiobook = result.scalar_one_or_none()
        if audiobook is None:
            return
        audiobook.status = AudiobookStatus.FAILED
        await session.flush()
        book_result = await session.execute(select(Book.title, Book.cover_url).where(Book.id == audiobook.book_id))
        book_row = book_result.first()
        book_title = book_row[0] if book_row else None
        book_cover_url = book_row[1] if book_row else None
        await publish_audiobook_row(
            audiobook,
            book_title=book_title,
            book_cover_url=book_cover_url,
            event_type="audiobook.updated",
        )

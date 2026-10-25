"""Audiobook generation orchestration. Synthesis runs in the cloner container."""

import asyncio
import logging
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.constants.language import cloner_for_language
from src.enums.cloner import ClonerType
from src.enums.media import AudiobookStatus, VoiceProfileStatus
from src.lib.cloner.client import clone_speech_http
from src.lib.error import (
    BOOK_CONTENT_URL_MISSING,
    BOOK_NOT_FOUND,
    VOICE_AUDIO_NOT_READY,
    VOICE_PROFILE_NOT_FOUND,
)
from src.lib.feature.sse.notify import publish_audiobook_row
from src.lib.module.jobs.db import job_session
from src.lib.module.jobs.errors import NonRetriableError
from src.lib.module.storage.local import (
    audiobook_object_path,
    download_book_content,
    download_voice,
    upload_audiobook,
)
from src.lib.schemas.cloner import GenerateAudiobookRequest
from src.models.content.audiobook import Audiobook
from src.models.content.book import Book
from src.models.content.reference import Reference
from src.models.content.voice import Voice

logger = logging.getLogger(__name__)

__all__ = [
    "create_queued_audiobook",
    "mark_audiobook_failed",
    "run_audiobook_generation_job",
]


@dataclass(frozen=True)
class _AudiobookJobWork:
    """Inputs for synthesis after the audiobook row is marked PROCESSING and committed."""

    audiobook_id: UUID
    user_id: UUID
    voice: Voice
    reference: Reference
    book: Book
    cloner_type: ClonerType | None
    book_title: str | None
    book_cover_url: str | None


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

    logger.info(
        "audiobook sync pipeline audiobook_id=%s book_id=%s voice_id=%s cloner=%s",
        audiobook_id,
        book.id,
        voice.id,
        (cloner_type or cloner_for_language(reference.language)).value,
    )

    logger.info("downloading reference voice audio")
    reference_audio = download_voice(voice.user_id, voice.id)
    logger.info("downloaded reference audio bytes=%d", len(reference_audio))

    logger.info("downloading book manuscript")
    book_text = download_book_content(book.id).decode("utf-8").strip()
    if not book_text:
        raise ValueError(BOOK_CONTENT_URL_MISSING)
    logger.info("book manuscript chars=%d", len(book_text))

    logger.info("starting speech synthesis via cloner HTTP")
    result = clone_speech_http(
        reference_audio=reference_audio,
        reference_text=voice.audio_text.strip(),
        source_text=book_text,
        language=reference.language,
        cloner_type=cloner_type,
    )
    logger.info(
        "speech synthesis complete duration=%.2fs output_bytes=%d",
        result.duration,
        len(result.audio_bytes),
    )

    object_path = audiobook_object_path(user_id, audiobook_id)
    logger.info("uploading audiobook to storage path=%s", object_path)
    content_url = upload_audiobook(
        object_path,
        result.audio_bytes,
        content_type="audio/wav",
    )
    logger.info("audiobook upload complete content_url=%s", content_url)
    return content_url, result.duration


async def create_queued_audiobook(
    request: GenerateAudiobookRequest,
    session: AsyncSession,
) -> Audiobook:
    """Validate inputs, create a QUEUED row (generation runs in the Redis worker)."""
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


async def _claim_audiobook_job(
    audiobook_id: UUID,
    *,
    cloner_type: ClonerType | None,
) -> Audiobook | _AudiobookJobWork:
    """Mark QUEUED audiobooks PROCESSING and commit before long-running synthesis."""
    async with job_session() as session:
        result = await session.execute(
            select(Audiobook).where(Audiobook.id == audiobook_id),
        )
        audiobook = result.scalar_one_or_none()
        if not audiobook:
            raise NonRetriableError("Audiobook not found")

        if audiobook.status not in (AudiobookStatus.QUEUED, AudiobookStatus.PROCESSING):
            return audiobook

        voice_result = await session.execute(
            select(Voice, Reference)
            .join(Reference, Voice.reference_id == Reference.id)
            .where(Voice.id == audiobook.voice_profile_id),
        )
        voice_row = voice_result.first()
        if voice_row is None:
            raise NonRetriableError(VOICE_PROFILE_NOT_FOUND)
        voice, reference = voice_row[0], voice_row[1]

        book_result = await session.execute(
            select(Book).where(Book.id == audiobook.book_id),
        )
        book = book_result.scalar_one_or_none()
        if not book:
            raise NonRetriableError(BOOK_NOT_FOUND)

        if audiobook.status is AudiobookStatus.QUEUED:
            audiobook.status = AudiobookStatus.PROCESSING
            await session.flush()
            await publish_audiobook_row(
                audiobook,
                book_title=book.title,
                book_cover_url=book.cover_url,
                book_author=book.author,
                book_language=book.language,
                event_type="audiobook.updated",
            )
            logger.info(
                "audiobook marked processing audiobook_id=%s (transaction committed before synthesis)",
                audiobook.id,
            )
        else:
            logger.info(
                "audiobook resume processing audiobook_id=%s status=%s",
                audiobook.id,
                audiobook.status.value,
            )

        return _AudiobookJobWork(
            audiobook_id=audiobook.id,
            user_id=audiobook.user_id,
            voice=voice,
            reference=reference,
            book=book,
            cloner_type=cloner_type,
            book_title=book.title,
            book_cover_url=book.cover_url,
        )


async def _persist_audiobook_result(
    audiobook_id: UUID,
    *,
    status: AudiobookStatus,
    book_title: str | None,
    book_cover_url: str | None,
    book_author: object | None = None,
    book_language: object | None = None,
    content_url: str | None = None,
    duration: float | None = None,
) -> Audiobook:
    """Persist terminal or failed audiobook state in a short DB transaction."""
    async with job_session() as session:
        result = await session.execute(
            select(Audiobook).where(Audiobook.id == audiobook_id),
        )
        audiobook = result.scalar_one_or_none()
        if audiobook is None:
            raise NonRetriableError("Audiobook not found")

        audiobook.status = status
        if content_url is not None:
            audiobook.content_url = content_url
        if duration is not None:
            audiobook.duration = duration
        if status is AudiobookStatus.COMPLETED:
            audiobook.completed_at = datetime.now(UTC)

        await session.flush()
        await session.refresh(audiobook)
        await publish_audiobook_row(
            audiobook,
            book_title=book_title,
            book_cover_url=book_cover_url,
            book_author=book_author,
            book_language=book_language,
            event_type="audiobook.updated",
        )
        logger.info(
            "audiobook persisted audiobook_id=%s status=%s",
            audiobook.id,
            audiobook.status.value,
        )
        return audiobook


async def run_audiobook_generation_job(
    audiobook_id: UUID,
    *,
    cloner_type: ClonerType | None = None,
) -> Audiobook:
    """Clone and upload for a queued audiobook (Redis worker)."""
    claimed = await _claim_audiobook_job(audiobook_id, cloner_type=cloner_type)
    if isinstance(claimed, Audiobook):
        logger.info(
            "audiobook job skipped audiobook_id=%s status=%s",
            claimed.id,
            claimed.status.value,
        )
        return claimed

    work = claimed
    try:
        content_url, duration = await asyncio.to_thread(
            _generate_audiobook_sync,
            voice=work.voice,
            reference=work.reference,
            book=work.book,
            audiobook_id=work.audiobook_id,
            user_id=work.user_id,
            cloner_type=work.cloner_type,
        )
    except Exception:
        logger.exception(
            "audiobook generation failed audiobook_id=%s cloner_type=%s",
            work.audiobook_id,
            work.cloner_type,
        )
        raise

    return await _persist_audiobook_result(
        work.audiobook_id,
        status=AudiobookStatus.COMPLETED,
        book_title=work.book_title,
        book_cover_url=work.book_cover_url,
        book_author=work.book.author,
        book_language=work.book.language,
        content_url=content_url,
        duration=duration,
    )


async def mark_audiobook_failed(audiobook_id: UUID) -> None:
    """Mark audiobook FAILED after exhausted retries."""
    async with job_session() as session:
        result = await session.execute(
            select(Audiobook).where(Audiobook.id == audiobook_id),
        )
        audiobook = result.scalar_one_or_none()
        if audiobook is None:
            return
        audiobook.status = AudiobookStatus.FAILED
        await session.flush()
        book_result = await session.execute(
            select(Book.title, Book.cover_url, Book.author, Book.language).where(Book.id == audiobook.book_id),
        )
        book_row = book_result.first()
        book_title = book_row[0] if book_row else None
        book_cover_url = book_row[1] if book_row else None
        book_author = book_row[2] if book_row else None
        book_language = book_row[3] if book_row else None
        await publish_audiobook_row(
            audiobook,
            book_title=book_title,
            book_cover_url=book_cover_url,
            book_author=book_author,
            book_language=book_language,
            event_type="audiobook.updated",
        )

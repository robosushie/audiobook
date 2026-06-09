"""Publish user-scoped SSE events after voice / audiobook state changes."""

from uuid import UUID

from sqlalchemy import select

from src.enums.language import Language
from src.lib.feature.sse.publish import publish_user_event
from src.lib.module.inngest.db import job_session
from src.lib.schemas.sse import AudiobookSSEPayload, UserEventType, VoiceSSEPayload
from src.models.content.audiobook import Audiobook
from src.models.content.book import Book
from src.models.content.reference import Reference
from src.models.content.voice import Voice
from src.models.player.playback import Playback


def _language_slug(value: object | None) -> str:
    if value is None:
        return ""
    if isinstance(value, Language):
        return str(value.value)
    return str(value)


async def publish_voice_row(
    profile: Voice,
    language: object,
    event_type: UserEventType,
) -> None:
    payload = VoiceSSEPayload(
        id=profile.id,
        user_id=profile.user_id,
        reference_id=profile.reference_id,
        label=profile.label,
        status=profile.status.value,
        duration=profile.duration,
        language=_language_slug(language),
        raw_url=profile.raw_url,
        audio_url=profile.audio_url,
    )
    await publish_user_event(
        profile.user_id,
        event_type,
        payload.model_dump(mode="json"),
    )


async def publish_audiobook_row(
    audiobook: Audiobook,
    *,
    book_title: str | None = None,
    book_cover_url: str | None = None,
    playback_progress: float = 0.0,
    event_type: UserEventType,
) -> None:
    payload = AudiobookSSEPayload(
        id=audiobook.id,
        user_id=audiobook.user_id,
        book_id=audiobook.book_id,
        voice_profile_id=audiobook.voice_profile_id,
        status=audiobook.status.value,
        content_url=audiobook.content_url,
        duration=audiobook.duration,
        book_title=book_title,
        book_cover_url=book_cover_url,
        playback_progress=min(max(playback_progress, 0.0), 1.0),
    )
    await publish_user_event(
        audiobook.user_id,
        event_type,
        payload.model_dump(mode="json"),
    )


async def publish_voice_event(profile_id: UUID, event_type: UserEventType) -> None:
    async with job_session() as session:
        result = await session.execute(
            select(Voice, Reference.language)
            .join(Reference, Voice.reference_id == Reference.id)
            .where(Voice.id == profile_id),
        )
        row = result.first()
        if row is None:
            return
        profile, language = row[0], row[1]
    await publish_voice_row(profile, language, event_type)


async def publish_audiobook_event(audiobook_id: UUID, event_type: UserEventType) -> None:
    async with job_session() as session:
        result = await session.execute(
            select(Audiobook, Book.title, Book.cover_url, Playback.progress)
            .outerjoin(Book, Audiobook.book_id == Book.id)
            .outerjoin(
                Playback,
                (Playback.audiobook_id == Audiobook.id) & (Playback.user_id == Audiobook.user_id),
            )
            .where(Audiobook.id == audiobook_id),
        )
        row = result.first()
        if row is None:
            return
        audiobook, book_title, book_cover_url, progress = row[0], row[1], row[2], row[3]
        playback_progress = float(progress) if progress is not None else 0.0
    await publish_audiobook_row(
        audiobook,
        book_title=book_title,
        book_cover_url=book_cover_url,
        playback_progress=playback_progress,
        event_type=event_type,
    )

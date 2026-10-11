"""Voice profile pipeline: queue a raw upload, then store the preprocess-service clip."""

import asyncio
import logging
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.enums.language import Language
from src.enums.media import VoiceProfileStatus
from src.lib.error import (
    REFERENCE_NOT_FOUND,
    REFERENCE_TEXT_REQUIRED,
    VOICE_PROFILE_NOT_FOUND,
)
from src.lib.feature.reference.passages import get_or_create_reference
from src.lib.feature.sse.notify import publish_voice_row
from src.lib.module.jobs.db import job_session
from src.lib.module.jobs.errors import NonRetriableError
from src.lib.module.storage.local import (
    delete_raw_voice,
    download_raw_voice,
    raw_voice_object_path,
    upload_voice,
    voice_object_path,
)
from src.lib.voice.audio import normalize_upload_to_wav_bytes
from src.lib.voice.client import prepare_voice_clip
from src.models.content.reference import Reference
from src.models.content.voice import Voice

logger = logging.getLogger(__name__)


async def create_queued_voice_profile(
    *,
    voice_data: bytes,
    name: str,
    user_id: UUID,
    session: AsyncSession,
    reference_id: UUID | None = None,
    reference_text: str | None = None,
    language: Language | None = None,
) -> Voice:
    """Upload raw audio, link reference, persist QUEUED profile (preprocess via Redis)."""
    if reference_id is not None:
        ref_result = await session.execute(select(Reference).where(Reference.id == reference_id))
        reference = ref_result.scalar_one_or_none()
        if not reference:
            raise ValueError(REFERENCE_NOT_FOUND)
    else:
        if not reference_text or not reference_text.strip():
            raise ValueError(REFERENCE_TEXT_REQUIRED)
        if language is None:
            raise ValueError(REFERENCE_TEXT_REQUIRED)
        reference = await get_or_create_reference(
            text=reference_text,
            language=language,
            session=session,
        )

    profile_id = uuid4()
    raw_path = raw_voice_object_path(user_id, profile_id)
    wav_bytes = normalize_upload_to_wav_bytes(voice_data)
    raw_url = upload_voice(raw_path, wav_bytes, content_type="audio/wav")

    profile = Voice(
        id=profile_id,
        label=name,
        user_id=user_id,
        reference_id=reference.id,
        raw_text=reference.text,
        raw_url=raw_url,
        audio_url=None,
        audio_text=None,
        duration=0.0,
        status=VoiceProfileStatus.QUEUED,
    )
    session.add(profile)
    await session.flush()
    await session.refresh(profile)
    return profile


async def run_voice_preprocess_job(profile_id: UUID) -> Voice:
    """Ask the preprocess service for a clean clip and store it on the profile."""
    async with job_session() as session:
        result = await session.execute(
            select(Voice, Reference)
            .join(Reference, Voice.reference_id == Reference.id)
            .where(Voice.id == profile_id),
        )
        row = result.first()
        if row is None:
            raise NonRetriableError(VOICE_PROFILE_NOT_FOUND)

        profile, reference = row[0], row[1]

        if profile.status not in (
            VoiceProfileStatus.QUEUED,
            VoiceProfileStatus.PROCESSING,
        ):
            return profile

        if not profile.raw_url:
            raise NonRetriableError("Voice profile has no raw_url to preprocess")

        reference_text = (profile.raw_text or reference.text).strip()
        if not reference_text:
            raise NonRetriableError(REFERENCE_TEXT_REQUIRED)

        if profile.status is VoiceProfileStatus.QUEUED:
            profile.status = VoiceProfileStatus.PROCESSING
            await session.flush()
            await publish_voice_row(profile, reference.language, "voice.updated")

        user_id = profile.user_id
        voice_id = profile.id
        language = reference.language

    voice_data = download_raw_voice(user_id, voice_id)
    prepared = await prepare_voice_clip(
        voice_data=voice_data,
        reference_text=reference_text,
        language=language,
    )
    logger.info(
        "preprocess service returned profile_id=%s duration=%.2fs score=%.3f",
        profile_id,
        prepared.duration,
        prepared.alignment_score,
    )
    object_path = voice_object_path(user_id, voice_id)
    audio_url = await asyncio.to_thread(
        upload_voice,
        object_path,
        prepared.wav_bytes,
        content_type="audio/wav",
    )

    async with job_session() as session:
        result = await session.execute(select(Voice).where(Voice.id == profile_id))
        profile = result.scalar_one_or_none()
        if profile is None:
            raise NonRetriableError(VOICE_PROFILE_NOT_FOUND)

        ref_result = await session.execute(
            select(Reference).where(Reference.id == profile.reference_id),
        )
        reference = ref_result.scalar_one()

        profile.audio_url = audio_url
        profile.audio_text = prepared.reference_text
        profile.duration = prepared.duration
        profile.status = VoiceProfileStatus.READY
        profile.raw_url = None

        await session.flush()
        await session.refresh(profile)
        await publish_voice_row(profile, reference.language, "voice.updated")

    try:
        await asyncio.to_thread(delete_raw_voice, user_id, voice_id)
    except OSError:
        logger.exception("raw voice delete failed profile_id=%s", profile_id)
    return profile


async def mark_voice_profile_failed(profile_id: UUID) -> None:
    """Mark profile FAILED after exhausted retries."""
    async with job_session() as session:
        result = await session.execute(select(Voice).where(Voice.id == profile_id))
        profile = result.scalar_one_or_none()
        if profile is None:
            return
        profile.status = VoiceProfileStatus.FAILED
        await session.flush()
        ref = await session.execute(
            select(Reference.language).where(Reference.id == profile.reference_id),
        )
        language = ref.scalar_one_or_none()
        await publish_voice_row(profile, language or Language.ENGLISH, "voice.updated")

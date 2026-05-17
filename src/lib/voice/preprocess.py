"""Voice profile pipeline: clip, STT alignment, preprocess, Supabase upload, DB row."""

import asyncio
from dataclasses import dataclass
from uuid import UUID, uuid4

import inngest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.language import Language
from src.enums.media import VoiceProfileStatus
from src.constants.voice import TARGET_SAMPLE_RATE
from src.lib.error import (
    REFERENCE_NOT_FOUND,
    REFERENCE_TEXT_REQUIRED,
    VOICE_PROFILE_NOT_FOUND,
)
from src.lib.feature.reference.passages import get_or_create_reference
from src.lib.module.inngest.db import job_session
from src.lib.module.storage.supabase import (
    delete_raw_voice,
    download_raw_voice,
    raw_voice_object_path,
    upload_voice,
    voice_object_path,
)
from src.lib.voice.audio import (
    audio_to_wav_bytes,
    load_audio_from_bytes,
    preprocess_for_storage,
    select_best_clip,
)
from src.lib.voice.stt import transcribe_wav
from src.lib.voice.text import find_aligned_reference_segment
from src.models.content.reference import Reference
from src.models.content.voice import Voice


@dataclass(frozen=True)
class _ProcessedVoiceResult:
    audio_url: str
    duration: float
    audio_text: str


def _preprocess_voice_sync(
    *,
    voice_data: bytes,
    reference_text: str,
    language: Language,
    user_id: UUID,
    profile_id: UUID,
) -> _ProcessedVoiceResult:
    """CPU/IO-heavy sync pipeline (run via asyncio.to_thread)."""
    audio, sample_rate = load_audio_from_bytes(voice_data)
    clip, clip_sr = select_best_clip(audio, sample_rate)

    stt_wav = audio_to_wav_bytes(clip, clip_sr)
    transcript = transcribe_wav(stt_wav, language)
    aligned_text = find_aligned_reference_segment(reference_text, transcript)

    processed_audio, duration = preprocess_for_storage(clip, clip_sr)
    upload_wav = audio_to_wav_bytes(processed_audio, TARGET_SAMPLE_RATE)

    object_path = voice_object_path(user_id, profile_id)
    audio_url = upload_voice(object_path, upload_wav, content_type="audio/wav")

    return _ProcessedVoiceResult(
        audio_url=audio_url,
        duration=duration,
        audio_text=aligned_text,
    )


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
    """Upload raw audio, link reference, persist QUEUED profile (preprocess via Inngest)."""
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
    raw_url = upload_voice(raw_path, voice_data, content_type="audio/wav")

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
    """Run preprocess for a queued profile (Inngest worker)."""
    async with job_session() as session:
        result = await session.execute(
            select(Voice, Reference)
            .join(Reference, Voice.reference_id == Reference.id)
            .where(Voice.id == profile_id),
        )
        row = result.first()
        if row is None:
            raise inngest.NonRetriableError(VOICE_PROFILE_NOT_FOUND)

        profile, reference = row[0], row[1]

        if profile.status not in (
            VoiceProfileStatus.QUEUED,
            VoiceProfileStatus.PROCESSING,
        ):
            return profile

        if not profile.raw_url:
            raise inngest.NonRetriableError("Voice profile has no raw_url to preprocess")

        profile.status = VoiceProfileStatus.PROCESSING
        await session.flush()

        reference_text = (profile.raw_text or reference.text).strip()
        if not reference_text:
            raise inngest.NonRetriableError(REFERENCE_TEXT_REQUIRED)

        voice_data = download_raw_voice(profile.user_id, profile.id)
        processed = await asyncio.to_thread(
            _preprocess_voice_sync,
            voice_data=voice_data,
            reference_text=reference_text,
            language=reference.language,
            user_id=profile.user_id,
            profile_id=profile.id,
        )

        profile.audio_url = processed.audio_url
        profile.audio_text = processed.audio_text
        profile.duration = processed.duration
        profile.status = VoiceProfileStatus.READY

        await asyncio.to_thread(delete_raw_voice, profile.user_id, profile.id)
        profile.raw_url = None

        await session.flush()
        await session.refresh(profile)
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

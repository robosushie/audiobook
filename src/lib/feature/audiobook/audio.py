"""Load generated audiobook audio for authenticated playback."""

import asyncio
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.media import AudiobookStatus
from src.lib.module.storage.supabase import AUDIOBOOK_BUCKET, audiobook_object_path, download_bytes
from src.models.content.audiobook import Audiobook


class AudiobookAudioNotFoundError(Exception):
    """Raised when the audiobook is missing, not owned, or has no audio yet."""


async def read_audiobook_audio_bytes(
    session: AsyncSession,
    *,
    user_id: UUID,
    audiobook_id: UUID,
) -> bytes:
    """Download audiobook WAV bytes from storage for the owning user."""
    result = await session.execute(
        select(Audiobook).where(
            Audiobook.id == audiobook_id,
            Audiobook.user_id == user_id,
        ),
    )
    audiobook = result.scalar_one_or_none()
    if audiobook is None:
        raise AudiobookAudioNotFoundError("Audiobook not found")
    if audiobook.status != AudiobookStatus.COMPLETED or not audiobook.content_url:
        raise AudiobookAudioNotFoundError("Audiobook audio is not ready")

    object_path = audiobook_object_path(user_id, audiobook_id)
    return await asyncio.to_thread(download_bytes, AUDIOBOOK_BUCKET, object_path)

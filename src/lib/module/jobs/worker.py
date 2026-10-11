"""Redis BRPOP worker with Postgres replay of queued / stale jobs."""

from __future__ import annotations

import asyncio
import logging
from datetime import UTC, datetime

from sqlalchemy import select
from src.enums.cloner import ClonerType
from src.enums.media import AudiobookStatus, VoiceProfileStatus
from src.lib.module.jobs.audiobook_generate import handle_audiobook_generate
from src.lib.module.jobs.db import job_session
from src.lib.module.jobs.errors import NonRetriableError
from src.lib.module.jobs.queues import (
    AUDIOBOOK_GENERATE_QUEUE,
    AUDIOBOOK_STALE_AFTER,
    VOICE_PREPROCESS_QUEUE,
    VOICE_STALE_AFTER,
)
from src.lib.module.jobs.redis import (
    brpop_job,
    enqueue_audiobook_generate,
    enqueue_voice_preprocess,
)
from src.lib.module.jobs.voice_preprocess import handle_voice_preprocess
from src.lib.schemas.events import AudiobookGenerateEventData, VoicePreprocessEventData
from src.models.content.audiobook import Audiobook
from src.models.content.voice import Voice

logger = logging.getLogger(__name__)


def _parse_cloner_type(value: object) -> ClonerType | None:
    if value is None or value == "":
        return None
    return ClonerType(str(value))


async def replay_pending_jobs() -> None:
    """Re-enqueue QUEUED rows and reclaim stale PROCESSING rows from Postgres."""
    now = datetime.now(UTC)
    async with job_session() as session:
        voices = (await session.execute(select(Voice))).scalars().all()
        audiobooks = (await session.execute(select(Audiobook))).scalars().all()

        voice_jobs: list[tuple[str, str]] = []
        for voice in voices:
            if voice.status is VoiceProfileStatus.QUEUED:
                voice_jobs.append((str(voice.id), str(voice.user_id)))
            elif (
                voice.status is VoiceProfileStatus.PROCESSING
                and voice.updated_at is not None
                and now - voice.updated_at >= VOICE_STALE_AFTER
            ):
                voice.status = VoiceProfileStatus.QUEUED
                voice_jobs.append((str(voice.id), str(voice.user_id)))

        audiobook_ids: list[str] = []
        for audiobook in audiobooks:
            if audiobook.status is AudiobookStatus.QUEUED:
                audiobook_ids.append(str(audiobook.id))
            elif (
                audiobook.status is AudiobookStatus.PROCESSING
                and audiobook.updated_at is not None
                and now - audiobook.updated_at >= AUDIOBOOK_STALE_AFTER
            ):
                audiobook.status = AudiobookStatus.QUEUED
                audiobook_ids.append(str(audiobook.id))

    for profile_id, user_id in voice_jobs:
        await enqueue_voice_preprocess(profile_id=profile_id, user_id=user_id)
        logger.info("replayed voice preprocess profile_id=%s", profile_id)
    for audiobook_id in audiobook_ids:
        await enqueue_audiobook_generate(audiobook_id=audiobook_id)
        logger.info("replayed audiobook generate audiobook_id=%s", audiobook_id)


async def _dispatch(queue: str, payload: dict[str, object]) -> None:
    attempt = int(payload.get("attempt") or 1)
    if queue == VOICE_PREPROCESS_QUEUE:
        data = VoicePreprocessEventData.model_validate(payload)
        await handle_voice_preprocess(data, attempt=attempt)
        return
    if queue == AUDIOBOOK_GENERATE_QUEUE:
        data = AudiobookGenerateEventData.model_validate(
            {
                "audiobook_id": payload.get("audiobook_id"),
                "cloner_type": _parse_cloner_type(payload.get("cloner_type")),
            },
        )
        await handle_audiobook_generate(data, attempt=attempt)
        return
    logger.error("unknown job queue=%s payload=%s", queue, payload)


async def run_worker(stop: asyncio.Event) -> None:
    """Consume Redis jobs until ``stop`` is set."""
    logger.info("job worker starting; replaying pending Postgres rows")
    try:
        await replay_pending_jobs()
    except Exception:
        logger.exception("pending job replay failed")

    while not stop.is_set():
        try:
            item = await brpop_job(timeout=5)
        except Exception:
            logger.exception("Redis BRPOP failed")
            await asyncio.sleep(2)
            continue
        if item is None:
            continue
        queue, payload = item
        try:
            await _dispatch(queue, payload)
        except NonRetriableError:
            continue
        except Exception:
            logger.exception("job handler error queue=%s", queue)

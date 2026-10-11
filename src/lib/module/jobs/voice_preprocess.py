"""Voice profile preprocess job handler."""

import logging

from src.lib.module.jobs.errors import NonRetriableError
from src.lib.module.jobs.queues import VOICE_PREPROCESS_MAX_ATTEMPTS
from src.lib.module.jobs.redis import enqueue_voice_preprocess
from src.lib.schemas.events import VoicePreprocessEventData
from src.lib.voice.preprocess import mark_voice_profile_failed, run_voice_preprocess_job

logger = logging.getLogger(__name__)


async def handle_voice_preprocess(
    data: VoicePreprocessEventData,
    *,
    attempt: int,
) -> None:
    """Clip, align, and store a queued voice profile."""
    logger.info(
        "voice preprocess started profile_id=%s attempt=%s",
        data.profile_id,
        attempt,
    )
    try:
        await run_voice_preprocess_job(data.profile_id)
    except NonRetriableError:
        logger.exception(
            "voice preprocess non-retriable profile_id=%s",
            data.profile_id,
        )
        await mark_voice_profile_failed(data.profile_id)
        raise
    except Exception:
        logger.exception(
            "voice preprocess failed profile_id=%s attempt=%s",
            data.profile_id,
            attempt,
        )
        if attempt >= VOICE_PREPROCESS_MAX_ATTEMPTS:
            await mark_voice_profile_failed(data.profile_id)
            raise
        await enqueue_voice_preprocess(
            profile_id=str(data.profile_id),
            user_id=str(data.user_id),
            attempt=attempt + 1,
        )

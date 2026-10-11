"""Audiobook generation job handler."""

import logging

from src.lib.cloner.cloner import mark_audiobook_failed, run_audiobook_generation_job
from src.lib.module.jobs.errors import NonRetriableError
from src.lib.module.jobs.queues import AUDIOBOOK_GENERATE_MAX_ATTEMPTS
from src.lib.module.jobs.redis import enqueue_audiobook_generate
from src.lib.schemas.events import AudiobookGenerateEventData

logger = logging.getLogger(__name__)


async def handle_audiobook_generate(
    data: AudiobookGenerateEventData,
    *,
    attempt: int,
) -> None:
    """Clone book text with a voice profile and upload to storage."""
    logger.info(
        "audiobook generate started audiobook_id=%s cloner_type=%s attempt=%s",
        data.audiobook_id,
        data.cloner_type,
        attempt,
    )
    try:
        await run_audiobook_generation_job(
            data.audiobook_id,
            cloner_type=data.cloner_type,
        )
    except NonRetriableError:
        logger.exception(
            "audiobook generate non-retriable audiobook_id=%s",
            data.audiobook_id,
        )
        await mark_audiobook_failed(data.audiobook_id)
        raise
    except Exception:
        logger.exception(
            "audiobook generate failed audiobook_id=%s attempt=%s",
            data.audiobook_id,
            attempt,
        )
        if attempt >= AUDIOBOOK_GENERATE_MAX_ATTEMPTS:
            await mark_audiobook_failed(data.audiobook_id)
            raise
        await enqueue_audiobook_generate(
            audiobook_id=str(data.audiobook_id),
            cloner_type=data.cloner_type.value if data.cloner_type else None,
            attempt=attempt + 1,
        )

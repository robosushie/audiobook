"""Redis client and list-queue helpers for background jobs."""

from __future__ import annotations

import json
import os
from functools import lru_cache
from typing import Any

import redis.asyncio as redis

from src.lib.module.jobs.queues import AUDIOBOOK_GENERATE_QUEUE, VOICE_PREPROCESS_QUEUE


def redis_url() -> str:
    """REDIS_URL, defaulting to local Docker Compose Redis."""
    return os.environ.get("REDIS_URL", "redis://localhost:6379/0")


@lru_cache(maxsize=1)
def get_redis() -> redis.Redis:
    """Return a cached asyncio Redis client (decode_responses=True)."""
    return redis.from_url(redis_url(), decode_responses=True)


async def enqueue(queue: str, payload: dict[str, Any]) -> None:
    """Push a JSON job onto the tail of ``queue``."""
    await get_redis().lpush(queue, json.dumps(payload))


async def enqueue_voice_preprocess(*, profile_id: str, user_id: str, attempt: int = 1) -> None:
    """Queue voice-profile preprocess work."""
    await enqueue(
        VOICE_PREPROCESS_QUEUE,
        {"profile_id": profile_id, "user_id": user_id, "attempt": attempt},
    )


async def enqueue_audiobook_generate(
    *,
    audiobook_id: str,
    cloner_type: str | None = None,
    attempt: int = 1,
) -> None:
    """Queue audiobook generation work."""
    await enqueue(
        AUDIOBOOK_GENERATE_QUEUE,
        {
            "audiobook_id": audiobook_id,
            "cloner_type": cloner_type,
            "attempt": attempt,
        },
    )


async def brpop_job(timeout: int = 5) -> tuple[str, dict[str, Any]] | None:
    """Block until a job is available on either queue, or ``timeout`` seconds elapse."""
    result = await get_redis().brpop(
        [VOICE_PREPROCESS_QUEUE, AUDIOBOOK_GENERATE_QUEUE],
        timeout=timeout,
    )
    if result is None:
        return None
    queue, raw = result
    payload = json.loads(raw)
    if not isinstance(payload, dict):
        msg = f"Invalid job payload on {queue}: {raw!r}"
        raise TypeError(msg)
    return queue, payload

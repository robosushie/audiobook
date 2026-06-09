"""Forward SSE events from the event worker process to the API server."""

import logging
import os
from uuid import UUID

import httpx

from src.lib.schemas.sse import UserEventType

logger = logging.getLogger(__name__)


def _should_forward_to_api() -> bool:
    return os.environ.get("SSE_FORWARD_TO_API", "").strip() in ("1", "true", "yes")


def _api_base_url() -> str | None:
    raw = os.environ.get("API_BASE_URL", "").strip().rstrip("/")
    return raw or None


def _internal_secret() -> str | None:
    raw = os.environ.get("INTERNAL_SSE_SECRET", "").strip()
    return raw or None


async def forward_user_event_to_api(
    user_id: UUID,
    event_type: UserEventType,
    data: dict,
) -> None:
    """POST an event to the API in-process broker (used by the event / Inngest worker)."""
    if not _should_forward_to_api():
        return

    base = _api_base_url()
    secret = _internal_secret()
    if not base or not secret:
        logger.warning(
            "SSE_FORWARD_TO_API is set but API_BASE_URL or INTERNAL_SSE_SECRET is missing; "
            "skipping SSE forward",
        )
        return

    url = f"{base}/internal/events/publish"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                url,
                json={
                    "user_id": str(user_id),
                    "type": event_type,
                    "data": data,
                },
                headers={"X-Internal-Secret": secret},
            )
            response.raise_for_status()
    except Exception as exc:
        logger.warning("Failed to forward SSE event to API: %s", exc)

"""Publish user-scoped SSE events (in-process or forwarded to the API)."""

import os

from uuid import UUID

from src.lib.feature.sse.forward import forward_user_event_to_api
from src.lib.module.sse.broker import user_event_broker
from src.lib.schemas.sse import UserEventType


async def publish_user_event(
    user_id: UUID,
    event_type: UserEventType,
    data: dict,
) -> None:
    """Deliver an SSE event to connected clients.

    - API process: publish to the in-memory broker attached to open streams.
    - Event worker: forward to the API internal endpoint (separate process).
    """
    if os.environ.get("SSE_FORWARD_TO_API", "").strip() in ("1", "true", "yes"):
        await forward_user_event_to_api(user_id, event_type, data)
        return

    await user_event_broker.publish(user_id, event_type, data)

"""Publish user-scoped SSE events to connected clients."""

from uuid import UUID

from src.lib.module.sse.broker import user_event_broker
from src.lib.schemas.sse import UserEventType


async def publish_user_event(
    user_id: UUID,
    event_type: UserEventType,
    data: dict,
) -> None:
    """Deliver an SSE event to open streams in this API process."""
    await user_event_broker.publish(user_id, event_type, data)

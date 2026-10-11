"""Server-sent events for real-time user updates."""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from src.lib.db import AsyncSessionLocal
from src.lib.feature.user.current import resolve_current_user
from src.lib.module.sse.broker import user_event_broker

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from src.models.user.user import User

TAG = "Events"
router = APIRouter(prefix="/events", tags=[TAG])


@router.get("/stream", name="User event stream")
async def stream_user_events(request: Request) -> StreamingResponse:
    """SSE stream of voice and audiobook updates for the signed-in user."""
    async with AsyncSessionLocal() as session:
        user: User = await resolve_current_user(request, session)

    user_id = user.id

    async def event_generator() -> AsyncIterator[str]:
        try:
            async for chunk in user_event_broker.stream(user_id):
                if await request.is_disconnected():
                    break
                yield chunk
        except Exception:  # noqa: BLE001
            return

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

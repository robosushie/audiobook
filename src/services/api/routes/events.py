"""Server-sent events for real-time user updates."""

import os
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.lib.db import AsyncSessionLocal
from src.lib.feature.user.current import resolve_current_user
from src.lib.module.sse.broker import user_event_broker
from src.lib.schemas.sse import UserEventType
from src.models.user.user import User

TAG = "Events"
router = APIRouter(prefix="/events", tags=[TAG])
internal_router = APIRouter(prefix="/internal/events", include_in_schema=False)


class InternalPublishBody(BaseModel):
    user_id: UUID
    type: UserEventType
    data: dict


def _verify_internal_secret(header: str | None) -> None:
    expected = os.environ.get("INTERNAL_SSE_SECRET", "").strip()
    if not expected or header != expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@internal_router.post("/publish", name="Internal SSE publish")
async def internal_publish_event(
    body: InternalPublishBody,
    x_internal_secret: str | None = Header(default=None, alias="X-Internal-Secret"),
) -> dict[str, bool]:
    """Receive events from the event worker and fan out to connected mobile clients."""
    _verify_internal_secret(x_internal_secret)
    await user_event_broker.publish(body.user_id, body.type, body.data)
    return {"ok": True}


@router.get("/stream", name="User event stream")
async def stream_user_events(request: Request) -> StreamingResponse:
    """SSE stream of voice and audiobook updates for the signed-in user."""
    async with AsyncSessionLocal() as session:
        user: User = await resolve_current_user(request, session)

    user_id = user.id

    async def event_generator():
        try:
            async for chunk in user_event_broker.stream(user_id):
                if await request.is_disconnected():
                    break
                yield chunk
        except Exception:
            # Client disconnected or server shutting down — end quietly.
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

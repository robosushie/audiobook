"""In-process SSE fan-out per user (single API instance)."""

import asyncio
import json
from collections import defaultdict
from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID

from src.lib.schemas.sse import UserEventType, UserSSEEnvelope


class UserEventBroker:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[UserSSEEnvelope | None]]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def subscribe(self, user_id: UUID) -> asyncio.Queue[UserSSEEnvelope | None]:
        queue: asyncio.Queue[UserSSEEnvelope | None] = asyncio.Queue(maxsize=64)
        key = str(user_id)
        async with self._lock:
            self._subscribers[key].add(queue)
        return queue

    async def unsubscribe(self, user_id: UUID, queue: asyncio.Queue[UserSSEEnvelope | None]) -> None:
        key = str(user_id)
        async with self._lock:
            subs = self._subscribers.get(key)
            if subs is None:
                return
            subs.discard(queue)
            if not subs:
                del self._subscribers[key]

    async def publish(self, user_id: UUID, event_type: UserEventType, data: dict[str, Any]) -> None:
        envelope = UserSSEEnvelope(type=event_type, data=data)
        key = str(user_id)
        async with self._lock:
            targets = list(self._subscribers.get(key, ()))
        for queue in targets:
            try:
                queue.put_nowait(envelope)
            except asyncio.QueueFull:
                pass

    async def stream(self, user_id: UUID) -> AsyncIterator[str]:
        queue = await self.subscribe(user_id)
        try:
            yield ": connected\n\n"
            while True:
                try:
                    envelope = await asyncio.wait_for(queue.get(), timeout=25.0)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    continue
                if envelope is None:
                    break
                payload = json.dumps(envelope.data, default=str)
                yield f"event: {envelope.type}\ndata: {payload}\n\n"
        finally:
            await self.unsubscribe(user_id, queue)


user_event_broker = UserEventBroker()

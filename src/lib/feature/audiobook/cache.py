"""Write-through cache of each user's recent audiobook list.

The hot window is one Redis string per user:

- ``ab:recent:{user_id}`` JSON ``{"gen", "total", "items"}`` of the newest rows
- ``ab:gen:{user_id}`` integer bumped when a change cannot be patched in place

List page 1 (no status filter) is served from the snapshot when its generation
matches. Status changes and new audiobooks patch that snapshot, so the app's
poll hits Redis. A list that was already reading the database stores only if
the generation is still the one it observed, which drops a stale snapshot
when a write landed mid-query.
"""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import UUID

from redis.exceptions import WatchError

from src.lib.module.jobs.redis import get_redis

logger = logging.getLogger(__name__)

RECENT_LIMIT = 50
SNAPSHOT_TTL_SECONDS = 6 * 60 * 60

_STORE_IF_CURRENT = """
local current = redis.call('GET', KEYS[1])
if current == false then
  current = '0'
end
if current ~= ARGV[1] then
  return 0
end
redis.call('SET', KEYS[2], ARGV[2], 'EX', tonumber(ARGV[3]))
return 1
"""


def _gen_key(user_id: UUID) -> str:
    return f"ab:gen:{user_id}"


def _snap_key(user_id: UUID) -> str:
    return f"ab:recent:{user_id}"


def _merge(item: dict[str, Any], fields: dict[str, Any]) -> None:
    for key, value in fields.items():
        if value is None and item.get(key) is not None:
            continue
        item[key] = value


async def read_recent_page(user_id: UUID, page_size: int) -> tuple[list[dict[str, Any]], int] | None:
    """Return the cached first page, or None when the window is cold or short."""
    try:
        client = get_redis()
        generation = await client.get(_gen_key(user_id)) or "0"
        raw = await client.get(_snap_key(user_id))
        if not raw:
            return None
        payload = json.loads(raw)
        if str(payload.get("gen")) != str(generation):
            return None
        items = payload.get("items")
        total = int(payload.get("total") or 0)
        if not isinstance(items, list):
            return None
        needed = min(page_size, total, RECENT_LIMIT)
        if len(items) < needed:
            return None
        page = [item for item in items[:page_size] if isinstance(item, dict)]
        if len(page) < needed:
            return None
        return page, total
    except Exception:
        logger.exception("audiobook cache read failed user_id=%s", user_id)
        return None


async def current_generation(user_id: UUID) -> str:
    """Generation observed before a database read. Store only if it is still current."""
    try:
        return str(await get_redis().get(_gen_key(user_id)) or "0")
    except Exception:
        logger.exception("audiobook cache generation read failed user_id=%s", user_id)
        return "0"


async def store_recent_page(
    user_id: UUID,
    generation: str,
    items: list[dict[str, Any]],
    total: int,
) -> None:
    """Save a database page when no audiobook write landed after ``generation``."""
    try:
        payload = json.dumps(
            {
                "gen": str(generation),
                "total": total,
                "items": items[:RECENT_LIMIT],
            },
        )
        await get_redis().eval(
            _STORE_IF_CURRENT,
            2,
            _gen_key(user_id),
            _snap_key(user_id),
            str(generation),
            payload,
            str(SNAPSHOT_TTL_SECONDS),
        )
    except Exception:
        logger.exception("audiobook cache store failed user_id=%s", user_id)


async def invalidate_recent_page(user_id: UUID) -> None:
    """Drop the hot window so the next list reloads from the database."""
    try:
        await _edit_snapshot(user_id, lambda _payload: None)
    except Exception:
        logger.exception("audiobook cache invalidate failed user_id=%s", user_id)


class _LeaveSnapshot:
    """Sentinel: the watched snapshot should stay as it is."""


def _edit_items(payload: dict[str, Any] | None, fields: dict[str, Any], *, created: bool) -> dict[str, Any] | None:
    if payload is None:
        return None
    items = payload.get("items")
    if not isinstance(items, list):
        return None
    audiobook_id = str(fields.get("id") or "")
    if not audiobook_id:
        return None
    for item in items:
        if isinstance(item, dict) and str(item.get("id")) == audiobook_id:
            _merge(item, fields)
            break
    else:
        items.insert(0, dict(fields))
        if created:
            payload["total"] = int(payload.get("total") or 0) + 1
        del items[RECENT_LIMIT:]
    payload["items"] = items
    return payload


async def _edit_snapshot(user_id: UUID, edit: Any) -> None:
    """Apply ``edit`` to the current snapshot and bump the generation together."""
    client = get_redis()
    gen_key = _gen_key(user_id)
    snap_key = _snap_key(user_id)
    for _ in range(5):
        try:
            async with client.pipeline() as pipe:
                await pipe.watch(gen_key, snap_key)
                raw = await client.get(snap_key)
                generation = int(await client.get(gen_key) or "0")
                current = json.loads(raw) if raw else None
                updated = edit(current)
                if updated is _LeaveSnapshot:
                    await pipe.reset()
                    return
                next_generation = str(generation + 1)
                pipe.multi()
                pipe.incr(gen_key)
                if updated is None:
                    pipe.delete(snap_key)
                else:
                    updated["gen"] = next_generation
                    pipe.set(snap_key, json.dumps(updated), ex=SNAPSHOT_TTL_SECONDS)
                await pipe.execute()
                return
        except WatchError:
            continue
    logger.warning("audiobook cache write lost the generation race user_id=%s", user_id)


async def upsert_recent_audiobook(
    user_id: UUID,
    fields: dict[str, Any],
    *,
    created: bool,
) -> None:
    """Patch one row in the hot window, or invalidate it when the window is cold."""
    try:
        await _edit_snapshot(user_id, lambda payload: _edit_items(payload, fields, created=created))
    except Exception:
        logger.exception("audiobook cache upsert failed user_id=%s", user_id)


async def patch_recent_progress(user_id: UUID, audiobook_id: UUID, progress: float) -> None:
    """Update playback progress on a cached row. Missing rows stay uncached."""
    target = str(audiobook_id)
    clamped = min(max(progress, 0.0), 1.0)

    def edit(payload: dict[str, Any] | None) -> dict[str, Any] | type[_LeaveSnapshot] | None:
        if payload is None:
            return _LeaveSnapshot
        items = payload.get("items")
        if not isinstance(items, list):
            return _LeaveSnapshot
        for item in items:
            if isinstance(item, dict) and str(item.get("id")) == target:
                item["playback_progress"] = clamped
                return payload
        return _LeaveSnapshot

    try:
        await _edit_snapshot(user_id, edit)
    except Exception:
        logger.exception("audiobook cache progress patch failed user_id=%s", user_id)

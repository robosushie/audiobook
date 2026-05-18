"""Helpers for Inngest function handlers."""

from typing import Any

import inngest


def trigger_event_data(ctx: inngest.Context) -> dict[str, Any]:
    """Return the user event payload from a normal run or ``on_failure`` callback."""
    raw = ctx.event.data
    if not isinstance(raw, dict):
        msg = "Expected event data to be a mapping"
        raise TypeError(msg)

    nested = raw.get("event")
    if isinstance(nested, dict) and isinstance(nested.get("data"), dict):
        return nested["data"]

    return raw

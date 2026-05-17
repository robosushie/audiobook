"""Resolve Inngest Cloud credentials from the environment.

- **INNGEST_EVENT_KEY** — send events (`inngest_client.send` from the API)
- **INNGEST_SIGNING_KEY** — verify/serve functions (`/api/inngest` on the event service)
"""

from __future__ import annotations

import os


def _read(name: str) -> str | None:
    value = os.getenv(name)
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def inngest_event_key() -> str | None:
    """Secret for publishing events to Inngest Cloud."""
    return _read("INNGEST_EVENT_KEY")


def inngest_signing_key() -> str | None:
    """Secret for signing traffic on the serve endpoint (/api/inngest)."""
    return _read("INNGEST_SIGNING_KEY")


def inngest_cloud_configured() -> bool:
    """True when both event and signing keys are set (production / Cloud mode)."""
    return inngest_event_key() is not None and inngest_signing_key() is not None


def inngest_is_production() -> bool:
    """Cloud mode unless INNGEST_DEV=1 or Cloud keys are missing."""
    if _read("INNGEST_DEV") == "1":
        return False
    return inngest_cloud_configured()

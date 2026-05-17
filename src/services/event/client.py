"""Shared Inngest client for the audiobook platform."""

import logging

import inngest

from src.lib.module.inngest.config import (
    inngest_event_key,
    inngest_is_production,
    inngest_signing_key,
)

INNGEST_APP_ID = "audiobook"

inngest_client = inngest.Inngest(
    app_id=INNGEST_APP_ID,
    logger=logging.getLogger("uvicorn"),
    is_production=inngest_is_production(),
    event_key=inngest_event_key(),
    signing_key=inngest_signing_key(),
)

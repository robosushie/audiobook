"""Send events from the API layer after rows are persisted."""

from uuid import UUID

import inngest

from src.enums.cloner import ClonerType
from src.lib.schemas.events import AudiobookGenerateEventData, VoicePreprocessEventData
from src.services.event.client import inngest_client
from src.services.event.events import (
    AUDIOBOOK_GENERATE_REQUESTED,
    VOICE_PREPROCESS_REQUESTED,
)


async def enqueue_voice_preprocess(*, profile_id: UUID, user_id: UUID) -> None:
    """Queue background preprocessing for an uploaded voice profile."""
    payload = VoicePreprocessEventData(profile_id=profile_id, user_id=user_id)
    await inngest_client.send(
        inngest.Event(
            name=VOICE_PREPROCESS_REQUESTED,
            data=payload.model_dump(mode="json"),
        ),
    )


async def enqueue_audiobook_generate(
    *,
    audiobook_id: UUID,
    cloner_type: ClonerType | None = None,
) -> None:
    """Queue background audiobook generation (clone + upload)."""
    payload = AudiobookGenerateEventData(
        audiobook_id=audiobook_id,
        cloner_type=cloner_type,
    )
    await inngest_client.send(
        inngest.Event(
            name=AUDIOBOOK_GENERATE_REQUESTED,
            data=payload.model_dump(mode="json"),
        ),
    )

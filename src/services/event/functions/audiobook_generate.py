"""Inngest function: audiobook voice cloning + upload."""

import inngest
from src.lib.cloner.cloner import mark_audiobook_failed, run_audiobook_generation_job
from src.lib.schemas.events import AudiobookGenerateEventData
from src.services.event.client import inngest_client
from src.services.event.events import AUDIOBOOK_GENERATE_REQUESTED


async def _on_audiobook_generate_failure(ctx: inngest.Context) -> None:
    data = AudiobookGenerateEventData.model_validate(ctx.event.data)
    await mark_audiobook_failed(data.audiobook_id)


@inngest_client.create_function(
    fn_id="audiobook-generate",
    name="Audiobook generation",
    trigger=inngest.TriggerEvent(event=AUDIOBOOK_GENERATE_REQUESTED),
    retries=1,
    on_failure=_on_audiobook_generate_failure,
)
async def audiobook_generate(ctx: inngest.Context) -> dict[str, str]:
    """Clone book text with a voice profile and upload to storage."""
    data = AudiobookGenerateEventData.model_validate(ctx.event.data)
    ctx.logger.info("audiobook generate started audiobook_id=%s", data.audiobook_id)

    async def _run() -> dict[str, str]:
        audiobook = await run_audiobook_generation_job(
            data.audiobook_id,
            cloner_type=data.cloner_type,
        )
        return {
            "audiobook_id": str(audiobook.id),
            "status": audiobook.status.value,
        }

    return await ctx.step.run("generate-audiobook", _run)

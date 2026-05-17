"""Inngest function: voice profile preprocess pipeline."""

import inngest
from src.lib.schemas.events import VoicePreprocessEventData
from src.lib.voice.preprocess import mark_voice_profile_failed, run_voice_preprocess_job
from src.services.event.client import inngest_client
from src.services.event.events import VOICE_PREPROCESS_REQUESTED


async def _on_voice_preprocess_failure(ctx: inngest.Context) -> None:
    data = VoicePreprocessEventData.model_validate(ctx.event.data)
    await mark_voice_profile_failed(data.profile_id)


@inngest_client.create_function(
    fn_id="voice-preprocess",
    name="Voice profile preprocess",
    trigger=inngest.TriggerEvent(event=VOICE_PREPROCESS_REQUESTED),
    retries=2,
    on_failure=_on_voice_preprocess_failure,
)
async def voice_preprocess(ctx: inngest.Context) -> dict[str, str]:
    """Clip, STT-align, preprocess, and finalize a queued voice profile."""
    data = VoicePreprocessEventData.model_validate(ctx.event.data)
    ctx.logger.info("voice preprocess started profile_id=%s", data.profile_id)

    async def _run() -> dict[str, str]:
        profile = await run_voice_preprocess_job(data.profile_id)
        return {"profile_id": str(profile.id), "status": profile.status.value}

    return await ctx.step.run("preprocess-voice", _run)

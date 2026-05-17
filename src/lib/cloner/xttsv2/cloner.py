"""Coqui XTTS v2 multilingual voice cloning."""

import tempfile
from pathlib import Path

import librosa

from src.constants.cloner import XTTS_MODEL_ID
from src.constants.language import language_to_iso
from src.lib.cloner.base import VoiceCloner
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

_TTS = None


def _patch_coqui_torch_load() -> None:
    """Allow Coqui checkpoints under PyTorch 2.6+ weights-only default."""
    from TTS.utils import io

    if getattr(io.load_fsspec, "_audiobook_patched", False):
        return

    original_load = io.load_fsspec

    def patched_load(path, map_location=None, **kwargs):
        kwargs["weights_only"] = False
        return original_load(path, map_location, **kwargs)

    patched_load._audiobook_patched = True  # type: ignore[attr-defined]
    io.load_fsspec = patched_load


def _load_tts():
    global _TTS
    if _TTS is not None:
        return _TTS

    import torch
    from TTS.api import TTS

    _patch_coqui_torch_load()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    _TTS = TTS(XTTS_MODEL_ID).to(device)
    return _TTS


class XTTSV2Cloner(VoiceCloner):
    """Synthesize speech with Coqui XTTS v2."""

    def clone(self, request: CloneRequest) -> CloneResult:
        iso = language_to_iso(request.language)

        with tempfile.TemporaryDirectory() as tmp_dir:
            ref_path = Path(tmp_dir) / "reference.wav"
            out_path = Path(tmp_dir) / "output.wav"
            ref_path.write_bytes(request.reference_audio)

            try:
                tts = _load_tts()
                tts.tts_to_file(
                    text=request.source_text,
                    speaker_wav=str(ref_path),
                    language=iso,
                    file_path=str(out_path),
                )
            except Exception as exc:
                raise RuntimeError(
                    CLONE_SYNTHESIS_FAILED.format(
                        cloner="xttsv2",
                        language=iso,
                        error=exc,
                    ),
                ) from exc

            duration = float(librosa.get_duration(path=out_path))
            audio_bytes = out_path.read_bytes()

        return CloneResult(audio_bytes=audio_bytes, duration=duration)

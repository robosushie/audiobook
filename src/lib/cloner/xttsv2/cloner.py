"""Coqui XTTS v2 multilingual voice cloning."""

import os
import tempfile
from pathlib import Path

import librosa

from src.constants.cloner import XTTS_MODEL_ID
from src.constants.language import language_to_iso
from src.lib.cloner.assets import get_cloner_asset_paths
from src.lib.cloner.base import VoiceCloner
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

_TTS = None


def _patch_xtts_load_audio() -> None:
    """Load reference WAV with soundfile (avoids torchcodec/torchaudio on PyTorch 2.9+)."""
    import torch
    import soundfile as sf
    import torchaudio.functional
    from TTS.tts.models import xtts as xtts_module

    if getattr(xtts_module, "_audiobook_patched", False):
        return

    def load_audio(audiopath: str, sampling_rate: int) -> torch.Tensor:
        data, lsr = sf.read(audiopath, dtype="float32", always_2d=True)
        audio = torch.from_numpy(data.T)
        if audio.size(0) != 1:
            audio = torch.mean(audio, dim=0, keepdim=True)
        if lsr != sampling_rate:
            audio = torchaudio.functional.resample(audio, lsr, sampling_rate)
        audio.clip_(-1, 1)
        return audio

    xtts_module.load_audio = load_audio
    xtts_module._audiobook_patched = True  # type: ignore[attr-defined]


def _load_tts():
    global _TTS
    if _TTS is not None:
        return _TTS

    _patch_xtts_load_audio()

    import torch
    from TTS.api import TTS

    assets = get_cloner_asset_paths()
    os.environ["TTS_HOME"] = str(assets.xtts_home)

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

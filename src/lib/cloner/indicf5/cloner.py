"""IndicF5 voice cloning (ai4bharat/IndicF5 weights via f5_tts inference stack)."""

import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

from src.constants.cloner import (
    INDICF5_MEL_SPEC_TYPE,
    INDICF5_ODE_METHOD,
    INDICF5_VOCODER_NAME,
)
from src.constants.language import language_to_iso
from src.lib.cloner.assets import get_cloner_asset_paths
from src.lib.cloner.base import VoiceCloner
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

_MODEL = None
_VOCODER = None
_DEVICE: str | None = None

_INDICF5_MODEL_CFG = {
    "dim": 1024,
    "depth": 22,
    "heads": 16,
    "ff_mult": 2,
    "text_dim": 512,
    "conv_layers": 4,
}


def _device() -> str:
    global _DEVICE
    if _DEVICE is None:
        _DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    return _DEVICE


def _load_models() -> tuple[object, object]:
    global _MODEL, _VOCODER
    if _MODEL is not None and _VOCODER is not None:
        return _MODEL, _VOCODER

    from f5_tts.infer.utils_infer import load_checkpoint, load_model, load_vocoder
    from f5_tts.model import DiT

    assets = get_cloner_asset_paths()
    device = _device()

    model = load_model(
        model_cls=DiT,
        model_cfg=_INDICF5_MODEL_CFG,
        mel_spec_type=INDICF5_MEL_SPEC_TYPE,
        vocab_file=str(assets.indicf5_vocab),
        ode_method=INDICF5_ODE_METHOD,
        use_ema=True,
        device=device,
    )
    _MODEL = load_checkpoint(model, str(assets.indicf5_ckpt), device, use_ema=True)
    _VOCODER = load_vocoder(
        vocoder_name=INDICF5_VOCODER_NAME,
        is_local=True,
        local_path=str(assets.indicf5_vocos_dir),
        device=device,
    )
    return _MODEL, _VOCODER


class IndicF5Cloner(VoiceCloner):
    """Synthesize speech with IndicF5 (ai4bharat/IndicF5 checkpoint)."""

    def clone(self, request: CloneRequest) -> CloneResult:
        from f5_tts.infer.utils_infer import infer_process

        with tempfile.TemporaryDirectory() as tmp_dir:
            ref_path = Path(tmp_dir) / "reference.wav"
            ref_path.write_bytes(request.reference_audio)

            try:
                model, vocoder = _load_models()
                wav, sr, _ = infer_process(
                    ref_audio=str(ref_path),
                    ref_text=request.reference_text,
                    gen_text=request.source_text,
                    model_obj=model,
                    vocoder=vocoder,
                    mel_spec_type=INDICF5_MEL_SPEC_TYPE,
                    device=_device(),
                )
            except Exception as exc:
                raise RuntimeError(
                    CLONE_SYNTHESIS_FAILED.format(
                        cloner="indicf5",
                        language=language_to_iso(request.language),
                        error=exc,
                    ),
                ) from exc

            if not isinstance(wav, np.ndarray):
                wav = np.asarray(wav, dtype=np.float32)
            wav = np.squeeze(wav).astype(np.float32, copy=False)

            out_path = Path(tmp_dir) / "output.wav"
            sf.write(str(out_path), wav, sr)
            audio_bytes = out_path.read_bytes()

        duration = float(len(wav) / sr)
        return CloneResult(audio_bytes=audio_bytes, duration=duration)

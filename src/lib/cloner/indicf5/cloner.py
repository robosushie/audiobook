"""IndicF5 voice cloning (ai4bharat/IndicF5 weights via f5_tts inference stack)."""

import gc
import logging
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

logger = logging.getLogger(__name__)

from src.constants.cloner import (
    INDICF5_MEL_SPEC_TYPE,
    INDICF5_ODE_METHOD,
    INDICF5_VOCODER_NAME,
)
from src.constants.language import language_to_iso
from src.lib.cloner.assets import get_cloner_asset_paths
from src.lib.cloner.base import VoiceCloner
from src.lib.cloner.torchaudio_patch import patch_torchaudio_load
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


_SKIP_STATE_KEYS = frozenset({"initted", "step"})
_STRIP_PREFIXES = ("ema_model.", "_orig_mod.")
_MEL_SPEC_DROP_KEYS = (
    "mel_spec.mel_stft.mel_scale.fb",
    "mel_spec.mel_stft.spectrogram.window",
)


def _normalize_indicf5_state_dict(raw: dict[str, torch.Tensor]) -> dict[str, torch.Tensor]:
    """Map IndicF5 safetensors keys to CFM ``transformer.*`` weights.

    The public checkpoint may include ``ema_model._orig_mod.`` prefixes from
    ``torch.compile`` and bundled vocoder weights; both must be handled here.
    """
    state: dict[str, torch.Tensor] = {}
    for key, value in raw.items():
        if key in _SKIP_STATE_KEYS or key.startswith("vocoder."):
            continue

        normalized = key
        while True:
            stripped = False
            for prefix in _STRIP_PREFIXES:
                if normalized.startswith(prefix):
                    normalized = normalized.removeprefix(prefix)
                    stripped = True
                    break
            if not stripped:
                break

        if not normalized.startswith("transformer."):
            continue
        if normalized in _MEL_SPEC_DROP_KEYS:
            continue

        state[normalized] = value
    return state


def _load_indicf5_checkpoint(model: torch.nn.Module, ckpt_path: str, device: str) -> torch.nn.Module:
    from safetensors.torch import load_file

    raw = load_file(ckpt_path, device=device)
    state_dict = _normalize_indicf5_state_dict(raw)
    if not state_dict:
        msg = f"No transformer weights found in IndicF5 checkpoint: {ckpt_path}"
        raise RuntimeError(msg)

    missing, unexpected = model.load_state_dict(state_dict, strict=False)
    if missing:
        logger.warning("IndicF5 checkpoint missing %d keys (first: %s)", len(missing), missing[0])
    if unexpected:
        logger.warning(
            "IndicF5 checkpoint had %d unexpected keys (first: %s)",
            len(unexpected),
            unexpected[0],
        )

    return model.to(device)


def _load_models() -> tuple[object, object]:
    global _MODEL, _VOCODER
    if _MODEL is not None and _VOCODER is not None:
        return _MODEL, _VOCODER

    patch_torchaudio_load()

    from f5_tts.infer.utils_infer import load_model, load_vocoder
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
    _MODEL = _load_indicf5_checkpoint(model, str(assets.indicf5_ckpt), device)
    _VOCODER = load_vocoder(
        vocoder_name=INDICF5_VOCODER_NAME,
        is_local=True,
        local_path=str(assets.vocos_dir),
        device=device,
    )
    return _MODEL, _VOCODER


class IndicF5Cloner(VoiceCloner):
    """Synthesize speech with IndicF5 (ai4bharat/IndicF5 checkpoint)."""

    def clone(self, request: CloneRequest) -> CloneResult:
        patch_torchaudio_load()
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

    def unload(self) -> None:
        unload_models()


def unload_models() -> None:
    """Drop cached IndicF5 weights from memory."""
    global _MODEL, _VOCODER
    _MODEL = None
    _VOCODER = None
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


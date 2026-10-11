"""Habibi Unified Arabic voice cloning (SWivid/Habibi-TTS)."""

import gc
import logging
import os
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

from src.constants.cloner import (
    HABIBI_CROSS_FADE_DURATION,
    HABIBI_DEFAULT_DIALECT,
    HABIBI_MEL_SPEC_TYPE,
    HABIBI_NFE_STEP,
    HABIBI_ODE_METHOD,
    INDICF5_VOCODER_NAME,
)
from src.constants.language import language_to_iso
from src.lib.cloner.assets import get_cloner_asset_paths
from src.lib.cloner.base import VoiceCloner
from src.lib.cloner.torchaudio_patch import patch_torchaudio_load
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

logger = logging.getLogger(__name__)

_MODEL = None
_VOCODER = None
_DEVICE: str | None = None

_HABIBI_MODEL_CFG = {
    "dim": 1024,
    "depth": 22,
    "heads": 16,
    "ff_mult": 2,
    "text_dim": 512,
    "conv_layers": 4,
}

_DIALECT_ID_MAP = {
    "UNK": "⓪",
    "MSA": "①",
    "SAU": "②",
    "UAE": "③",
    "ALG": "④",
    "IRQ": "⑤",
    "EGY": "⑥",
    "MAR": "⑦",
    "OMN": "⑧",
    "TUN": "⑨",
    "LEV": "⑩",
    "SDN": "⑪",
    "LBY": "⑫",
}


def _device() -> str:
    global _DEVICE
    if _DEVICE is None:
        _DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Habibi using device=%s", _DEVICE)
    return _DEVICE


def _dialect() -> str:
    raw = os.environ.get("HABIBI_DIALECT", HABIBI_DEFAULT_DIALECT).strip().upper()
    if raw not in _DIALECT_ID_MAP:
        logger.warning("Unknown HABIBI_DIALECT=%s; falling back to %s", raw, HABIBI_DEFAULT_DIALECT)
        return HABIBI_DEFAULT_DIALECT
    return raw


def _dialect_id() -> str:
    return _DIALECT_ID_MAP[_dialect()]


def _clear_cuda() -> None:
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


def unload_models() -> None:
    """Drop cached Habibi weights from memory."""
    global _MODEL, _VOCODER
    _MODEL = None
    _VOCODER = None
    _clear_cuda()


def _load_models() -> tuple[object, object]:
    global _MODEL, _VOCODER
    if _MODEL is not None and _VOCODER is not None:
        return _MODEL, _VOCODER

    patch_torchaudio_load()
    from f5_tts.infer.utils_infer import load_model, load_vocoder
    from f5_tts.model import DiT

    assets = get_cloner_asset_paths()
    device = _device()

    logger.info("Habibi loading Unified DiT from %s", assets.habibi_ckpt)
    try:
        _MODEL = load_model(
            DiT,
            _HABIBI_MODEL_CFG,
            str(assets.habibi_ckpt),
            mel_spec_type=HABIBI_MEL_SPEC_TYPE,
            vocab_file=str(assets.habibi_vocab),
            ode_method=HABIBI_ODE_METHOD,
            device=device,
        )
    except TypeError:
        model = load_model(
            model_cls=DiT,
            model_cfg=_HABIBI_MODEL_CFG,
            mel_spec_type=HABIBI_MEL_SPEC_TYPE,
            vocab_file=str(assets.habibi_vocab),
            ode_method=HABIBI_ODE_METHOD,
            use_ema=True,
            device=device,
        )
        from f5_tts.infer.utils_infer import load_checkpoint

        _MODEL = load_checkpoint(model, str(assets.habibi_ckpt), device, use_ema=True)

    _VOCODER = load_vocoder(
        vocoder_name=INDICF5_VOCODER_NAME,
        is_local=True,
        local_path=str(assets.vocos_dir),
        device=device,
    )
    return _MODEL, _VOCODER


def _infer(ref_path: str, ref_text: str, gen_text: str, model: object, vocoder: object) -> tuple[np.ndarray, int]:
    dialect_id = _dialect_id()
    try:
        from habibi_tts.infer.utils_infer import infer_process as habibi_infer

        wav, sr, _ = habibi_infer(
            ref_path,
            ref_text,
            gen_text,
            model,
            vocoder,
            mel_spec_type=HABIBI_MEL_SPEC_TYPE,
            nfe_step=HABIBI_NFE_STEP,
            cross_fade_duration=HABIBI_CROSS_FADE_DURATION,
            device=_device(),
            dialect_id=dialect_id,
        )
        return np.asarray(wav, dtype=np.float32), int(sr)
    except ImportError:
        logger.warning("habibi-tts not importable; using f5_tts infer_process with dialect wrap")
        from f5_tts.infer.utils_infer import infer_process

        wrapped_ref = f"{dialect_id}〈{ref_text}〉"
        wrapped_gen = f"{dialect_id}〈{gen_text}〉"
        wav, sr, _ = infer_process(
            ref_audio=ref_path,
            ref_text=wrapped_ref,
            gen_text=wrapped_gen,
            model_obj=model,
            vocoder=vocoder,
            mel_spec_type=HABIBI_MEL_SPEC_TYPE,
            nfe_step=HABIBI_NFE_STEP,
            cross_fade_duration=HABIBI_CROSS_FADE_DURATION,
            device=_device(),
        )
        return np.asarray(wav, dtype=np.float32), int(sr)


class HabibiTTSCloner(VoiceCloner):
    """Synthesize Arabic speech with Habibi Unified (CC-BY-NC-SA-4.0 weights)."""

    def clone(self, request: CloneRequest) -> CloneResult:
        patch_torchaudio_load()
        with tempfile.TemporaryDirectory() as tmp_dir:
            ref_path = Path(tmp_dir) / "reference.wav"
            ref_path.write_bytes(request.reference_audio)

            try:
                model, vocoder = _load_models()
                logger.info(
                    "Habibi infer start dialect=%s gen_chars=%d",
                    _dialect(),
                    len(request.source_text),
                )
                wav, sr = _infer(
                    str(ref_path),
                    request.reference_text,
                    request.source_text,
                    model,
                    vocoder,
                )
            except Exception as exc:
                logger.exception("Habibi synthesis failed")
                raise RuntimeError(
                    CLONE_SYNTHESIS_FAILED.format(
                        cloner="habitibtts",
                        language=language_to_iso(request.language),
                        error=exc,
                    ),
                ) from exc

            wav = np.squeeze(wav).astype(np.float32, copy=False)
            out_path = Path(tmp_dir) / "output.wav"
            sf.write(str(out_path), wav, sr)
            audio_bytes = out_path.read_bytes()

        duration = float(len(wav) / sr)
        return CloneResult(audio_bytes=audio_bytes, duration=duration)

    def unload(self) -> None:
        unload_models()

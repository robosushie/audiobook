"""F5-TTS voice cloning (English and IndicF5 checkpoint)."""

import tempfile
from pathlib import Path

import torch
import torchaudio

from src.constants.cloner import (
    F5_CKPT_URI,
    F5_MEL_SPEC_TYPE,
    F5_MODEL_CLS,
    F5_ODE_METHOD,
    F5_VOCAB_URI,
    F5_VOCODER_NAME,
)
from src.constants.language import language_to_iso
from src.lib.cloner.base import VoiceCloner
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

_MODEL = None
_VOCODER = None
_DEVICE: str | None = None


def _device() -> str:
    global _DEVICE
    if _DEVICE is None:
        _DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    return _DEVICE


def _load_models() -> tuple[object, object]:
    global _MODEL, _VOCODER
    if _MODEL is not None and _VOCODER is not None:
        return _MODEL, _VOCODER

    from cached_path import cached_path
    from f5_tts.infer.utils_infer import load_model, load_vocoder

    device = _device()
    ckpt_file = str(cached_path(F5_CKPT_URI))
    vocab_file = str(cached_path(F5_VOCAB_URI))
    _MODEL = load_model(
        model_cls=F5_MODEL_CLS,
        model_cfg=dict(dim=1024, depth=22, heads=16, ff_mult=2, text_dim=512, conv_layers=4),
        ckpt_path=ckpt_file,
        vocab_file=vocab_file,
        ode_method=F5_ODE_METHOD,
        use_ema=True,
        device=device,
    )
    _VOCODER = load_vocoder(vocoder_name=F5_VOCODER_NAME, is_local=False, local_path="")
    return _MODEL, _VOCODER


class F5TTSCloner(VoiceCloner):
    """Synthesize speech with SWivid F5-TTS (IndicF5-compatible checkpoint)."""

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
                    mel_spec_type=F5_MEL_SPEC_TYPE,
                    device=_device(),
                )
            except Exception as exc:
                raise RuntimeError(
                    CLONE_SYNTHESIS_FAILED.format(
                        cloner="f5tts",
                        language=language_to_iso(request.language),
                        error=exc,
                    ),
                ) from exc

            out_path = Path(tmp_dir) / "output.wav"
            torchaudio.save(str(out_path), wav, sr)
            audio_bytes = out_path.read_bytes()

        duration = float(wav.shape[1] / sr)
        return CloneResult(audio_bytes=audio_bytes, duration=duration)

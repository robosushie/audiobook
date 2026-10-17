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
from src.lib.cloner.f5_batches import use_serial_f5_batches
from src.lib.cloner.torchaudio_patch import patch_torchaudio_load
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

_MODEL = None
_VOCODER = None
_DEVICE: str | None = None

# f5_tts uses float16 once CUDA compute capability reaches this major version.
_CUDA_FP16_MIN_MAJOR = 7

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
        logger.info("IndicF5 using device=%s", _DEVICE)
    return _DEVICE


def _inference_dtype(device: str) -> torch.dtype:
    """Match f5_tts: float16 on CUDA compute capability 7 and above.

    A 1660 Ti is 7.5 with 6GB. Float32 DiT weights plus the diffusion
    activations do not stay resident, so the step crawls in shared memory.
    """
    if "cuda" not in device or not torch.cuda.is_available():
        return torch.float32
    props = torch.cuda.get_device_properties(device)
    name = torch.cuda.get_device_name(device)
    if props.major >= _CUDA_FP16_MIN_MAJOR and not name.endswith("[ZLUDA]"):
        return torch.float16
    return torch.float32


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

    dtype = _inference_dtype(device)
    # Cast on CPU first. Loading the float32 checkpoint straight onto a 6GB
    # card, then casting, holds both copies in VRAM.
    model = model.to(dtype=dtype)
    raw = load_file(ckpt_path, device="cpu")
    state_dict = _normalize_indicf5_state_dict(raw)
    del raw
    if not state_dict:
        msg = f"No transformer weights found in IndicF5 checkpoint: {ckpt_path}"
        raise RuntimeError(msg)

    missing, unexpected = model.load_state_dict(state_dict, strict=False)
    del state_dict
    gc.collect()
    if missing:
        logger.warning("IndicF5 checkpoint missing %d keys (first: %s)", len(missing), missing[0])
    if unexpected:
        logger.warning(
            "IndicF5 checkpoint had %d unexpected keys (first: %s)",
            len(unexpected),
            unexpected[0],
        )

    model.eval()
    model = model.to(device)
    if device.startswith("cuda"):
        torch.cuda.empty_cache()

    gpu = "cpu"
    if device.startswith("cuda") and torch.cuda.is_available():
        props = torch.cuda.get_device_properties(device)
        gib = props.total_memory / 1024**3
        gpu = f"{torch.cuda.get_device_name(device)} {gib:.1f}GB"
    logger.info(
        "IndicF5 ready device=%s dtype=%s gpu=%s",
        device,
        str(dtype).removeprefix("torch."),
        gpu,
    )
    return model


def _load_models() -> tuple[object, object]:
    global _MODEL, _VOCODER
    if _MODEL is not None and _VOCODER is not None:
        return _MODEL, _VOCODER

    patch_torchaudio_load()

    from f5_tts.infer.utils_infer import hop_length, load_vocoder, n_fft, n_mel_channels, target_sample_rate, win_length
    from f5_tts.model import CFM, DiT
    from f5_tts.model.utils import get_tokenizer

    assets = get_cloner_asset_paths()
    device = _device()
    # IndicF5 checkpoints use ema/_orig_mod key prefixes that f5_tts load_model
    # does not strip, and that helper now requires ckpt_path. Build the CFM
    # shell here and load the weights with the IndicF5 normalizer.
    vocab_char_map, vocab_size = get_tokenizer(str(assets.indicf5_vocab), "custom")
    model = CFM(
        transformer=DiT(
            **_INDICF5_MODEL_CFG,
            text_num_embeds=vocab_size,
            mel_dim=n_mel_channels,
        ),
        mel_spec_kwargs={
            "n_fft": n_fft,
            "hop_length": hop_length,
            "win_length": win_length,
            "n_mel_channels": n_mel_channels,
            "target_sample_rate": target_sample_rate,
            "mel_spec_type": INDICF5_MEL_SPEC_TYPE,
        },
        odeint_kwargs={"method": INDICF5_ODE_METHOD},
        vocab_char_map=vocab_char_map,
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
                use_serial_f5_batches("f5_tts.infer.utils_infer")
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


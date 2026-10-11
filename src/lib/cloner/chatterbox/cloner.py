"""Chatterbox English voice cloning (Resemble AI)."""

import gc
import logging
import re
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

from src.constants.cloner import CHATTERBOX_MAX_CHUNK_CHARS
from src.constants.language import language_to_iso
from src.lib.cloner.assets import get_cloner_asset_paths
from src.lib.cloner.base import VoiceCloner
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

logger = logging.getLogger(__name__)

_MODEL = None
_DEVICE: str | None = None


def _device() -> str:
    global _DEVICE
    if _DEVICE is None:
        _DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info("Chatterbox using device=%s", _DEVICE)
    return _DEVICE


def _clear_cuda() -> None:
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


def unload_models() -> None:
    """Drop cached Chatterbox weights from memory."""
    global _MODEL
    _MODEL = None
    _clear_cuda()


def _load_model() -> object:
    global _MODEL
    if _MODEL is not None:
        return _MODEL

    from chatterbox.tts import ChatterboxTTS

    assets = get_cloner_asset_paths()
    device = _device()
    if (assets.chatterbox_dir / "t3_cfg.safetensors").is_file():
        logger.info("Chatterbox loading from %s", assets.chatterbox_dir)
        _MODEL = ChatterboxTTS.from_local(assets.chatterbox_dir, device=device)
    else:
        logger.info("Chatterbox loading from_pretrained device=%s", device)
        _MODEL = ChatterboxTTS.from_pretrained(device=device)
    return _MODEL


def _chunk_text(text: str, max_chars: int = CHATTERBOX_MAX_CHUNK_CHARS) -> list[str]:
    """Split long manuscripts into sentence-ish chunks Chatterbox can generate."""
    stripped = text.strip()
    if len(stripped) <= max_chars:
        return [stripped]

    sentences = re.split(r"(?<=[.!?。！？])\s+", stripped)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        candidate = f"{current} {sentence}".strip() if current else sentence
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            chunks.append(current)
        if len(sentence) <= max_chars:
            current = sentence
            continue
        for start in range(0, len(sentence), max_chars):
            piece = sentence[start : start + max_chars].strip()
            if piece:
                chunks.append(piece)
        current = ""
    if current:
        chunks.append(current)
    return chunks or [stripped]


class ChatterboxCloner(VoiceCloner):
    """Synthesize English speech with Resemble Chatterbox (zero-shot cloning)."""

    def clone(self, request: CloneRequest) -> CloneResult:
        with tempfile.TemporaryDirectory() as tmp_dir:
            ref_path = Path(tmp_dir) / "reference.wav"
            ref_path.write_bytes(request.reference_audio)

            try:
                model = _load_model()
                chunks = _chunk_text(request.source_text)
                logger.info("Chatterbox infer start chunks=%d chars=%d", len(chunks), len(request.source_text))
                waves: list[np.ndarray] = []
                sample_rate = int(model.sr)
                for index, chunk in enumerate(chunks):
                    wav = model.generate(chunk, audio_prompt_path=str(ref_path))
                    if isinstance(wav, torch.Tensor):
                        wav = wav.detach().cpu().numpy()
                    wave = np.squeeze(np.asarray(wav, dtype=np.float32))
                    waves.append(wave)
                    logger.info("Chatterbox chunk %d/%d samples=%d", index + 1, len(chunks), wave.size)
                combined = np.concatenate(waves) if len(waves) > 1 else waves[0]
            except Exception as exc:
                logger.exception("Chatterbox synthesis failed")
                raise RuntimeError(
                    CLONE_SYNTHESIS_FAILED.format(
                        cloner="chatterbox",
                        language=language_to_iso(request.language),
                        error=exc,
                    ),
                ) from exc

            out_path = Path(tmp_dir) / "output.wav"
            sf.write(str(out_path), combined, sample_rate)
            audio_bytes = out_path.read_bytes()

        duration = float(len(combined) / sample_rate)
        return CloneResult(audio_bytes=audio_bytes, duration=duration)

    def unload(self) -> None:
        unload_models()

"""Chatterbox voice cloning (Resemble AI).

English uses the dedicated ChatterboxTTS checkpoint. Hindi uses the official
multilingual v3 model with ``language_id="hi"``. Only one of those weight sets
stays on the GPU at a time.
"""

import gc
import logging
import re
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

from src.constants.cloner import CHATTERBOX_HINDI_LANGUAGE_ID, CHATTERBOX_HINDI_T3, CHATTERBOX_MAX_CHUNK_CHARS
from src.constants.language import language_to_iso
from src.enums.language import Language
from src.lib.cloner.assets import get_cloner_asset_paths
from src.lib.cloner.base import VoiceCloner
from src.lib.error import CLONE_SYNTHESIS_FAILED
from src.lib.schemas.cloner import CloneRequest, CloneResult

logger = logging.getLogger(__name__)

_ENGLISH = None
_HINDI = None
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
    global _ENGLISH, _HINDI
    _ENGLISH = None
    _HINDI = None
    _clear_cuda()


def _release_english() -> None:
    global _ENGLISH
    if _ENGLISH is None:
        return
    _ENGLISH = None
    _clear_cuda()


def _release_hindi() -> None:
    global _HINDI
    if _HINDI is None:
        return
    _HINDI = None
    _clear_cuda()


def _load_english() -> object:
    global _ENGLISH
    if _ENGLISH is not None:
        return _ENGLISH

    _release_hindi()
    from chatterbox.tts import ChatterboxTTS

    assets = get_cloner_asset_paths()
    device = _device()
    if (assets.chatterbox_dir / "t3_cfg.safetensors").is_file():
        logger.info("Chatterbox English loading from %s", assets.chatterbox_dir)
        _ENGLISH = ChatterboxTTS.from_local(assets.chatterbox_dir, device=device)
    else:
        logger.info("Chatterbox English loading from_pretrained device=%s", device)
        _ENGLISH = ChatterboxTTS.from_pretrained(device=device)
    return _ENGLISH


def _load_hindi() -> object:
    global _HINDI
    if _HINDI is not None:
        return _HINDI

    _release_english()
    from chatterbox.mtl_tts import ChatterboxMultilingualTTS

    assets = get_cloner_asset_paths()
    device = _device()
    t3_path = assets.chatterbox_mtl_dir / CHATTERBOX_HINDI_T3
    s3gen_path = assets.chatterbox_mtl_dir / "s3gen.pt"
    if t3_path.is_file() and s3gen_path.is_file():
        logger.info("Chatterbox Hindi loading language pack from %s", assets.chatterbox_mtl_dir)
        try:
            _HINDI = ChatterboxMultilingualTTS.from_local(
                assets.chatterbox_mtl_dir,
                device,
                t3_model=CHATTERBOX_HINDI_T3,
            )
        except TypeError:
            logger.info("Chatterbox multilingual build has no t3_model argument; loading pretrained v3")
            _HINDI = ChatterboxMultilingualTTS.from_pretrained(device)
    else:
        logger.info("Chatterbox Hindi loading multilingual v3 from_pretrained device=%s", device)
        try:
            _HINDI = ChatterboxMultilingualTTS.from_pretrained(device, t3_model="v3")
        except TypeError:
            _HINDI = ChatterboxMultilingualTTS.from_pretrained(device)
    return _HINDI


def _chunk_text(text: str, max_chars: int = CHATTERBOX_MAX_CHUNK_CHARS) -> list[str]:
    """Split long manuscripts into sentence-ish chunks Chatterbox can generate."""
    stripped = text.strip()
    if len(stripped) <= max_chars:
        return [stripped]

    sentences = re.split(r"(?<=[.!?।。！？])\s+", stripped)
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


def _wave_from_generate(wav: object) -> np.ndarray:
    if isinstance(wav, torch.Tensor):
        wav = wav.detach().cpu().numpy()
    return np.squeeze(np.asarray(wav, dtype=np.float32))


class ChatterboxCloner(VoiceCloner):
    """Synthesize English or Hindi speech with Resemble Chatterbox."""

    def clone(self, request: CloneRequest) -> CloneResult:
        hindi = request.language is Language.HINDI
        with tempfile.TemporaryDirectory() as tmp_dir:
            ref_path = Path(tmp_dir) / "reference.wav"
            ref_path.write_bytes(request.reference_audio)

            try:
                model = _load_hindi() if hindi else _load_english()
                chunks = _chunk_text(request.source_text)
                logger.info(
                    "Chatterbox infer start language=%s chunks=%d chars=%d",
                    request.language.value,
                    len(chunks),
                    len(request.source_text),
                )
                waves: list[np.ndarray] = []
                sample_rate = int(model.sr)
                for index, chunk in enumerate(chunks):
                    if hindi:
                        wav = model.generate(
                            chunk,
                            language_id=CHATTERBOX_HINDI_LANGUAGE_ID,
                            audio_prompt_path=str(ref_path),
                        )
                    else:
                        wav = model.generate(chunk, audio_prompt_path=str(ref_path))
                    wave = _wave_from_generate(wav)
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

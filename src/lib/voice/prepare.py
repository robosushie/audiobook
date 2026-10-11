"""Force-align a reading, cut a clean reference clip, and denoise it.

Model imports stay inside the loaders so the API and event worker can run
without the preprocess Poetry group installed.
"""

from __future__ import annotations

import logging
import os
import re
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from scipy.signal import butter, sosfiltfilt
from src.constants.language import language_to_iso639_3
from src.constants.voice import (
    ALIGN_SAMPLE_RATE,
    DENOISE_SAMPLE_RATE,
    EDGE_PAD_SECONDS,
    HIGHPASS_HZ,
    KEPT_PAUSE_SECONDS,
    MAX_INTERNAL_PAUSE_SECONDS,
    MIN_SPEECH_SECONDS,
    PEAK_TARGET,
    TARGET_SAMPLE_RATE,
    VAD_EDGE_PAD_SECONDS,
)
from src.enums.language import Language
from src.lib.error import (
    PREPARE_ALIGNMENT_FAILED,
    PREPARE_DECODE_FAILED,
    PREPARE_EMPTY_TEXT,
    PREPARE_TOO_LITTLE_SPEECH,
)
from src.lib.voice.audio import AudioDecodeError, audio_to_wav_bytes, decode_mono
from src.lib.voice.errors import PrepareRejected
from src.lib.voice.span import AlignedWord, WordSpan, select_word_span

logger = logging.getLogger(__name__)

_LOCK = threading.Lock()


@dataclass
class _Models:
    align_model: Any
    tokenizer: Any
    df_model: Any
    df_state: Any
    vad: Any


_MODELS: _Models | None = None


@dataclass(frozen=True, slots=True)
class PreparedReference:
    """WAV bytes plus the passage text that was actually spoken in the clip."""

    wav_bytes: bytes
    reference_text: str
    duration: float
    alignment_score: float


def _configure_process() -> None:
    """Keep preprocess on CPU and store weights under PREPROCESS_MODEL_DIR."""
    if os.environ.get("PREPROCESS_DEVICE", "cpu") == "cpu":
        os.environ["CUDA_VISIBLE_DEVICES"] = ""
    root = Path(os.environ.get("PREPROCESS_MODEL_DIR", "temp/preprocess-models"))
    root.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("HF_HOME", str(root / "huggingface"))
    os.environ.setdefault("HF_HUB_CACHE", str(root / "huggingface" / "hub"))
    os.environ.setdefault("TORCH_HOME", str(root / "torch"))
    os.environ.setdefault("XDG_CACHE_HOME", str(root))


def load_prepare_models() -> None:
    """Load the aligner, denoiser, and VAD once. Safe to call more than once."""
    global _MODELS
    if _MODELS is not None:
        return

    _configure_process()
    import torch
    from ctc_forced_aligner import load_alignment_model
    from df.enhance import init_df
    from silero_vad import load_silero_vad

    logger.info("loading MMS forced aligner")
    align_model, tokenizer = load_alignment_model("cpu", dtype=torch.float32)
    logger.info("loading DeepFilterNet3")
    # deepfilternet 0.5.6 returns (model, df_state, suffix).
    df_model, df_state, _suffix = init_df(
        log_file=None,
        log_level="WARNING",
        default_model="DeepFilterNet3",
    )
    df_model = df_model.to(torch.device("cpu")).eval()
    logger.info("loading Silero VAD")
    vad = load_silero_vad()
    _MODELS = _Models(
        align_model=align_model,
        tokenizer=tokenizer,
        df_model=df_model,
        df_state=df_state,
        vad=vad,
    )
    logger.info("preprocess models ready")


def prepare_reference(
    audio_bytes: bytes,
    reference_text: str,
    language: Language,
) -> PreparedReference:
    """Return a cleaned clip whose transcript is a substring of ``reference_text``."""
    text = reference_text.strip()
    if not text:
        raise PrepareRejected(PREPARE_EMPTY_TEXT)
    if not audio_bytes:
        raise PrepareRejected(PREPARE_DECODE_FAILED)

    with _LOCK:
        load_prepare_models()
        return _prepare_locked(audio_bytes, text, language)


def _prepare_locked(audio_bytes: bytes, reference_text: str, language: Language) -> PreparedReference:
    try:
        decoded = decode_mono(audio_bytes, DENOISE_SAMPLE_RATE)
    except AudioDecodeError as exc:
        raise PrepareRejected(PREPARE_DECODE_FAILED) from exc

    denoised = _denoise(decoded)
    if denoised.size == 0:
        raise PrepareRejected(PREPARE_DECODE_FAILED)

    aligned = _align(denoised, reference_text, language_to_iso639_3(language))
    span = select_word_span(aligned)
    clip = _cut(denoised, DENOISE_SAMPLE_RATE, span.start_time, span.end_time)
    cleaned = _trim_and_compress(clip, DENOISE_SAMPLE_RATE)
    finished = _finalize(cleaned, DENOISE_SAMPLE_RATE)
    duration = len(finished) / TARGET_SAMPLE_RATE
    return PreparedReference(
        wav_bytes=audio_to_wav_bytes(finished, TARGET_SAMPLE_RATE),
        reference_text=_passage_substring(reference_text, span),
        duration=duration,
        alignment_score=span.alignment_score,
    )


def _models() -> _Models:
    if _MODELS is None:
        msg = "Preprocess models are not loaded"
        raise RuntimeError(msg)
    return _MODELS


def _resample(audio: np.ndarray, origin: int, target: int) -> np.ndarray:
    if origin == target or audio.size == 0:
        return audio.astype(np.float32, copy=False)
    import torch
    import torchaudio

    wav = torch.from_numpy(np.ascontiguousarray(audio, dtype=np.float32)).unsqueeze(0)
    converted = torchaudio.functional.resample(wav, origin, target)
    return converted.squeeze(0).detach().cpu().numpy().astype(np.float32)


def _denoise(audio: np.ndarray) -> np.ndarray:
    import torch
    from df.enhance import enhance

    models = _models()
    wav = torch.from_numpy(np.ascontiguousarray(audio, dtype=np.float32)).unsqueeze(0)
    enhanced = enhance(models.df_model, models.df_state, wav)
    return enhanced.squeeze(0).detach().cpu().numpy().astype(np.float32)


def _align(audio_48k: np.ndarray, reference_text: str, iso639_3: str) -> list[AlignedWord]:
    import torch
    from ctc_forced_aligner import (
        generate_emissions,
        get_alignments,
        get_spans,
        postprocess_results,
        preprocess_text,
    )

    models = _models()
    audio_16k = _resample(audio_48k, DENOISE_SAMPLE_RATE, ALIGN_SAMPLE_RATE)
    waveform = torch.from_numpy(np.ascontiguousarray(audio_16k, dtype=np.float32))
    try:
        emissions, stride = generate_emissions(
            models.align_model,
            waveform,
            window_length=30,
            context_length=2,
            batch_size=2,
        )
        tokens_starred, text_starred = preprocess_text(
            reference_text,
            romanize=True,
            language=iso639_3,
            split_size="word",
            star_frequency="edges",
        )
        segments, scores, blank_token = get_alignments(
            emissions,
            tokens_starred,
            models.tokenizer,
        )
        spans = get_spans(tokens_starred, segments, blank_token)
        results = postprocess_results(text_starred, spans, stride, scores, 0.0)
    except (AssertionError, ValueError, RuntimeError, IndexError) as exc:
        logger.exception("forced alignment failed")
        raise PrepareRejected(PREPARE_ALIGNMENT_FAILED) from exc

    words: list[AlignedWord] = []
    for index, segment in enumerate(results):
        text = str(segment["text"])
        start = float(segment["start"])
        end = float(segment["end"])
        score = float(segment["score"])
        end = max(end, start)
        words.append(AlignedWord(text=text, start=start, end=end, score=score, token_index=index))

    expected = len(re.findall(r"\S+", reference_text))
    if len(words) != expected or not words:
        raise PrepareRejected(PREPARE_ALIGNMENT_FAILED)
    return words


def _cut(audio: np.ndarray, sample_rate: int, start: float, end: float) -> np.ndarray:
    duration = len(audio) / sample_rate
    left = max(0.0, start - EDGE_PAD_SECONDS)
    right = min(duration, end + EDGE_PAD_SECONDS)
    i0 = int(left * sample_rate)
    i1 = max(i0 + 1, int(right * sample_rate))
    return audio[i0:min(i1, len(audio))]


def _speech_regions(audio: np.ndarray, sample_rate: int) -> list[tuple[float, float]]:
    import torch
    from silero_vad import get_speech_timestamps

    models = _models()
    wav = torch.from_numpy(_resample(audio, sample_rate, ALIGN_SAMPLE_RATE))
    stamps = get_speech_timestamps(
        wav,
        models.vad,
        sampling_rate=ALIGN_SAMPLE_RATE,
        return_seconds=True,
        min_speech_duration_ms=100,
        min_silence_duration_ms=100,
    )
    regions: list[tuple[float, float]] = []
    for stamp in stamps:
        start = float(stamp["start"])
        end = float(stamp["end"])
        if end > start:
            regions.append((start, end))
    return regions


def _slice_seconds(audio: np.ndarray, sample_rate: int, start: float, end: float) -> np.ndarray:
    i0 = max(0, int(start * sample_rate))
    i1 = min(len(audio), int(end * sample_rate))
    if i1 <= i0:
        return np.zeros(0, dtype=np.float32)
    return audio[i0:i1]


def _trim_and_compress(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    regions = _speech_regions(audio, sample_rate)
    speech_seconds = sum(end - start for start, end in regions)
    if speech_seconds < MIN_SPEECH_SECONDS:
        raise PrepareRejected(PREPARE_TOO_LITTLE_SPEECH)

    duration = len(audio) / sample_rate
    pieces: list[np.ndarray] = []
    lead = max(0.0, regions[0][0] - VAD_EDGE_PAD_SECONDS)
    pieces.append(_slice_seconds(audio, sample_rate, lead, regions[0][1]))
    for previous, nxt in zip(regions, regions[1:], strict=False):
        gap = nxt[0] - previous[1]
        if gap > MAX_INTERNAL_PAUSE_SECONDS:
            midpoint = previous[1] + (gap / 2.0)
            half = KEPT_PAUSE_SECONDS / 2.0
            pieces.append(_slice_seconds(audio, sample_rate, midpoint - half, midpoint + half))
        elif gap > 0:
            pieces.append(_slice_seconds(audio, sample_rate, previous[1], nxt[0]))
        pieces.append(_slice_seconds(audio, sample_rate, nxt[0], nxt[1]))
    tail = min(duration, regions[-1][1] + VAD_EDGE_PAD_SECONDS)
    if tail > regions[-1][1]:
        pieces.append(_slice_seconds(audio, sample_rate, regions[-1][1], tail))

    pieces = [piece for piece in pieces if piece.size > 0]
    if not pieces:
        raise PrepareRejected(PREPARE_TOO_LITTLE_SPEECH)
    return np.concatenate(pieces).astype(np.float32)


def _finalize(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    if audio.size < sample_rate // 10:
        raise PrepareRejected(PREPARE_TOO_LITTLE_SPEECH)
    sos = butter(4, HIGHPASS_HZ, btype="highpass", fs=sample_rate, output="sos")
    filtered = sosfiltfilt(sos, audio).astype(np.float32)
    peaked = _peak_normalize(filtered)
    return _resample(peaked, sample_rate, TARGET_SAMPLE_RATE)


def _peak_normalize(audio: np.ndarray) -> np.ndarray:
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    if peak <= 0.0:
        raise PrepareRejected(PREPARE_TOO_LITTLE_SPEECH)
    return (audio / peak * PEAK_TARGET).astype(np.float32)


def _passage_substring(reference_text: str, span: WordSpan) -> str:
    tokens = list(re.finditer(r"\S+", reference_text))
    if span.start_index < 0 or span.end_index >= len(tokens):
        raise PrepareRejected(PREPARE_ALIGNMENT_FAILED)
    start = tokens[span.start_index].start()
    end = tokens[span.end_index].end()
    snippet = reference_text[start:end].strip()
    if not snippet:
        raise PrepareRejected(PREPARE_ALIGNMENT_FAILED)
    return snippet

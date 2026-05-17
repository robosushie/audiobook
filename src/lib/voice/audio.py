"""Audio I/O, best-clip selection, and librosa preprocessing for voice profiles."""

import io

import librosa
import numpy as np
import soundfile as sf

from src.constants.voice import (
    CLIPPING_AMPLITUDE_THRESHOLD,
    DEFAULT_CLIP_SECONDS,
    MAX_CLIP_SECONDS,
    MIN_CLIP_SECONDS,
    PEAK_TARGET,
    RMS_SILENCE_THRESHOLD,
    TARGET_SAMPLE_RATE,
    WINDOW_HOP_SECONDS,
)


def load_audio_from_bytes(data: bytes) -> tuple[np.ndarray, int]:
    """Decode arbitrary audio bytes to mono float32 waveform and sample rate."""
    buffer = io.BytesIO(data)
    audio, sample_rate = librosa.load(buffer, sr=None, mono=True)
    return audio.astype(np.float32), int(sample_rate)


def audio_to_wav_bytes(audio: np.ndarray, sample_rate: int) -> bytes:
    """Encode float32 mono audio as 16-bit PCM WAV bytes."""
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format="WAV", subtype="PCM_16")
    return buffer.getvalue()


def _score_segment(window: np.ndarray) -> float:
    """Higher is better: clear speech, not silence or heavily clipped."""
    rms = float(np.sqrt(np.mean(window**2)))
    if rms < RMS_SILENCE_THRESHOLD:
        return -1e9

    zcr = float(np.mean(librosa.feature.zero_crossing_rate(window)))
    clipping_ratio = float(np.mean(np.abs(window) > CLIPPING_AMPLITUDE_THRESHOLD))

    rms_score = np.log1p(rms * 100.0)
    zcr_score = -abs(zcr - 0.08) * 20.0
    clipping_penalty = clipping_ratio * 80.0

    return rms_score + zcr_score - clipping_penalty


def _resample_to_target(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    if sample_rate == TARGET_SAMPLE_RATE:
        return audio
    return librosa.resample(audio, orig_sr=sample_rate, target_sr=TARGET_SAMPLE_RATE).astype(np.float32)


def select_best_clip(audio: np.ndarray, sample_rate: int) -> tuple[np.ndarray, int]:
    """Return the highest-quality ~11 s segment at 24 kHz."""
    audio = _resample_to_target(audio, sample_rate)
    clip_samples = int(DEFAULT_CLIP_SECONDS * TARGET_SAMPLE_RATE)
    min_samples = int(MIN_CLIP_SECONDS * TARGET_SAMPLE_RATE)
    max_samples = int(MAX_CLIP_SECONDS * TARGET_SAMPLE_RATE)

    if len(audio) <= max_samples:
        if len(audio) < min_samples and len(audio) > 0:
            pad = min_samples - len(audio)
            audio = np.pad(audio, (0, pad), mode="constant")
        return audio, TARGET_SAMPLE_RATE

    hop = max(1, int(WINDOW_HOP_SECONDS * TARGET_SAMPLE_RATE))
    best_score = -np.inf
    best_start = 0

    for start in range(0, len(audio) - clip_samples + 1, hop):
        window = audio[start : start + clip_samples]
        score = _score_segment(window)
        if score > best_score:
            best_score = score
            best_start = start

    clip = audio[best_start : best_start + clip_samples]
    return clip, TARGET_SAMPLE_RATE


def preprocess_for_storage(audio: np.ndarray, sample_rate: int) -> tuple[np.ndarray, float]:
    """Resample to 24 kHz, cap length at 12 s, peak-normalize; return audio and duration."""
    if sample_rate != TARGET_SAMPLE_RATE:
        audio = librosa.resample(
            audio, orig_sr=sample_rate, target_sr=TARGET_SAMPLE_RATE
        ).astype(np.float32)
        sample_rate = TARGET_SAMPLE_RATE

    max_samples = int(MAX_CLIP_SECONDS * TARGET_SAMPLE_RATE)
    if len(audio) > max_samples:
        audio = audio[:max_samples]

    if audio.dtype == np.int16:
        audio = audio.astype(np.float32) / 32768.0

    peak = float(np.abs(audio).max())
    if peak > 0:
        audio = (audio / peak * PEAK_TARGET).astype(np.float32)

    duration = len(audio) / TARGET_SAMPLE_RATE
    return audio, duration

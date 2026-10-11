"""Audio I/O helpers for voice profile uploads and the preprocess service."""

import io
import shutil
import subprocess
import tempfile
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
from src.constants.voice import FFMPEG_TIMEOUT_SECONDS, TARGET_SAMPLE_RATE


class AudioDecodeError(RuntimeError):
    """Raised when ffmpeg cannot decode an uploaded recording."""


def _is_wav(data: bytes) -> bool:
    return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WAVE"


def _guess_suffix(data: bytes) -> str:
    if data[:4] == b"RIFF":
        return ".wav"
    if data[:4] == bytes([0x1A, 0x45, 0xDF, 0xA3]):
        return ".webm"
    if data[:3] == b"ID3" or (len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0):
        return ".mp3"
    if len(data) >= 8 and data[4:8] == b"ftyp":
        return ".m4a"
    return ".audio"


def _load_with_torchaudio(data: bytes) -> tuple[np.ndarray, int]:
    import torchaudio

    buffer = io.BytesIO(data)
    try:
        waveform, sample_rate = torchaudio.load(buffer)
    except Exception:
        suffix = _guess_suffix(data)
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(data)
            tmp_path = tmp.name
        try:
            waveform, sample_rate = torchaudio.load(tmp_path)
        finally:
            Path(tmp_path).unlink(missing_ok=True)

    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)
    audio = waveform.squeeze(0).detach().cpu().numpy().astype(np.float32)
    return audio, int(sample_rate)


def _load_with_ffmpeg(data: bytes) -> tuple[np.ndarray, int]:
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        msg = "Cannot decode this audio format. Install ffmpeg or upload WAV."
        raise RuntimeError(msg)

    suffix = _guess_suffix(data)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as src:
        src.write(data)
        src_path = src.name
    dst_path = f"{src_path}.wav"
    try:
        subprocess.run(
            [ffmpeg, "-y", "-i", src_path, "-ac", "1", "-ar", str(TARGET_SAMPLE_RATE), dst_path],
            check=True,
            capture_output=True,
        )
        audio, sample_rate = librosa.load(dst_path, sr=None, mono=True)
        return audio.astype(np.float32), int(sample_rate)
    finally:
        Path(src_path).unlink(missing_ok=True)
        Path(dst_path).unlink(missing_ok=True)


def load_audio_from_bytes(data: bytes) -> tuple[np.ndarray, int]:
    """Decode audio bytes (WAV, WebM, MP3, etc.) to mono float32 waveform and sample rate."""
    if _is_wav(data):
        buffer = io.BytesIO(data)
        audio, sample_rate = librosa.load(buffer, sr=None, mono=True)
        return audio.astype(np.float32), int(sample_rate)

    try:
        return _load_with_torchaudio(data)
    except Exception:
        return _load_with_ffmpeg(data)


def normalize_upload_to_wav_bytes(data: bytes) -> bytes:
    """Ensure upload bytes are PCM WAV (Supabase path may be raw.wav but content must be WAV)."""
    if _is_wav(data):
        return data
    audio, sample_rate = load_audio_from_bytes(data)
    return audio_to_wav_bytes(audio, sample_rate)


def audio_to_wav_bytes(audio: np.ndarray, sample_rate: int) -> bytes:
    """Encode float32 mono audio as 16-bit PCM WAV bytes."""
    buffer = io.BytesIO()
    sf.write(buffer, audio, sample_rate, format="WAV", subtype="PCM_16")
    return buffer.getvalue()


def decode_mono(data: bytes, sample_rate: int) -> np.ndarray:
    """Decode audio bytes to mono float32 at ``sample_rate`` using ffmpeg."""
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        msg = "ffmpeg is required to decode voice recordings"
        raise RuntimeError(msg)

    suffix = _guess_suffix(data)
    with tempfile.TemporaryDirectory() as tmp:
        src_path = Path(tmp) / f"input{suffix}"
        dst_path = Path(tmp) / "decoded.wav"
        src_path.write_bytes(data)
        try:
            subprocess.run(
                [
                    ffmpeg,
                    "-y",
                    "-i",
                    str(src_path),
                    "-ac",
                    "1",
                    "-ar",
                    str(sample_rate),
                    str(dst_path),
                ],
                check=True,
                capture_output=True,
                timeout=FFMPEG_TIMEOUT_SECONDS,
            )
        except subprocess.CalledProcessError as exc:
            stderr = exc.stderr.decode(errors="replace") if exc.stderr else ""
            msg = f"ffmpeg failed to decode audio: {stderr[-500:]}"
            raise AudioDecodeError(msg) from exc
        except subprocess.TimeoutExpired as exc:
            msg = "ffmpeg timed out while decoding audio"
            raise AudioDecodeError(msg) from exc
        audio, _sample_rate = sf.read(dst_path, dtype="float32", always_2d=False)
    return np.asarray(audio, dtype=np.float32).reshape(-1)

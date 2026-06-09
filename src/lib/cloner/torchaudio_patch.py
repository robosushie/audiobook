"""Avoid torchcodec when loading WAV files (PyTorch 2.9+ / Windows)."""

from __future__ import annotations

from typing import Any


def patch_torchaudio_load() -> None:
    """Route ``torchaudio.load`` through soundfile for local file paths."""
    import soundfile as sf
    import torch
    import torchaudio

    if getattr(torchaudio, "_audiobook_soundfile_patch", False):
        return

    _original_load = torchaudio.load

    def load(uri: Any, *args: Any, **kwargs: Any) -> tuple[torch.Tensor, int]:
        if isinstance(uri, str):
            try:
                data, sample_rate = sf.read(uri, dtype="float32", always_2d=True)
            except Exception:
                return _original_load(uri, *args, **kwargs)

            audio = torch.from_numpy(data.T)
            if audio.dim() == 1:
                audio = audio.unsqueeze(0)
            if audio.size(0) > 1:
                audio = torch.mean(audio, dim=0, keepdim=True)
            return audio, int(sample_rate)

        return _original_load(uri, *args, **kwargs)

    torchaudio.load = load  # type: ignore[method-assign]
    torchaudio._audiobook_soundfile_patch = True  # type: ignore[attr-defined]

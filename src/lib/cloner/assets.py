"""Download and resolve on-disk paths for voice cloning weights (no GPU warmup)."""

from __future__ import annotations

import logging
import os
import shutil
from dataclasses import dataclass
from pathlib import Path

from dotenv import find_dotenv, load_dotenv
from src.constants.cloner import (
    CHATTERBOX_FILES,
    CHATTERBOX_REPO,
    HABIBI_CKPT_FILENAME,
    HABIBI_REPO,
    HABIBI_VOCAB_FILENAME,
    INDICF5_CKPT_FILENAME,
    INDICF5_REPO,
    INDICF5_VOCAB_FILENAME,
    INDICF5_VOCODER_REPO,
)

load_dotenv(find_dotenv(usecwd=True))

logger = logging.getLogger(__name__)

_VOCOS_FILES = ("config.yaml", "pytorch_model.bin")

_paths: ClonerAssetPaths | None = None


@dataclass(frozen=True)
class ClonerAssetPaths:
    """Resolved filesystem locations under the cloner model root."""

    root: Path
    indicf5_ckpt: Path
    indicf5_vocab: Path
    habibi_ckpt: Path
    habibi_vocab: Path
    chatterbox_dir: Path
    vocos_dir: Path

    @property
    def indicf5_vocos_dir(self) -> Path:
        """Backward-compatible alias for shared Vocos weights."""
        return self.vocos_dir


def cloner_model_root() -> Path:
    """Base directory for cloner assets (default: repo ``temp/``)."""
    override = os.environ.get("CLONER_MODEL_DIR")
    if override:
        return Path(override).expanduser().resolve()
    return Path(__file__).resolve().parents[3] / "temp"


def _hf_token() -> str | None:
    return os.environ.get("HF_TOKEN") or os.environ.get("HUGGING_FACE_HUB_TOKEN")


def _materialize(source: Path, target: Path) -> Path:
    """Ensure ``target`` exists, copying from ``source`` when needed."""
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        return target
    if not source.exists():
        msg = f"Download did not produce expected file: {source}"
        raise FileNotFoundError(msg)
    if source.resolve() != target.resolve():
        shutil.copy2(source, target)
    return target


def _download_vocos(vocos_dir: Path) -> None:
    from huggingface_hub import hf_hub_download

    vocos_dir.mkdir(parents=True, exist_ok=True)
    for filename in _VOCOS_FILES:
        dest = vocos_dir / filename
        if dest.exists():
            continue
        logger.info("Downloading Vocos %s to %s", filename, dest)
        hf_hub_download(
            repo_id=INDICF5_VOCODER_REPO,
            filename=filename,
            local_dir=str(vocos_dir),
        )


def _download_indicf5_assets(root: Path) -> tuple[Path, Path]:
    from huggingface_hub import hf_hub_download

    indicf5_dir = root / "indicf5"
    indicf5_dir.mkdir(parents=True, exist_ok=True)

    ckpt_target = indicf5_dir / INDICF5_CKPT_FILENAME
    vocab_target = indicf5_dir / "vocab.txt"
    token = _hf_token()

    if not ckpt_target.exists():
        logger.info("Downloading IndicF5 checkpoint to %s", ckpt_target)
        ckpt_source = Path(
            hf_hub_download(
                repo_id=INDICF5_REPO,
                filename=INDICF5_CKPT_FILENAME,
                token=token,
            ),
        )
        _materialize(ckpt_source, ckpt_target)
    else:
        logger.info("IndicF5 checkpoint already present at %s", ckpt_target)

    if not vocab_target.exists():
        logger.info("Downloading IndicF5 vocab to %s", vocab_target)
        vocab_source = Path(
            hf_hub_download(
                repo_id=INDICF5_REPO,
                filename=INDICF5_VOCAB_FILENAME,
                token=token,
            ),
        )
        _materialize(vocab_source, vocab_target)
    else:
        logger.info("IndicF5 vocab already present at %s", vocab_target)

    return ckpt_target, vocab_target


def _download_habibi_assets(root: Path) -> tuple[Path, Path]:
    from huggingface_hub import hf_hub_download

    habibi_dir = root / "habibi"
    habibi_dir.mkdir(parents=True, exist_ok=True)

    ckpt_target = habibi_dir / "model_200000.safetensors"
    vocab_target = habibi_dir / "vocab.txt"

    if not ckpt_target.exists():
        logger.info("Downloading Habibi Unified checkpoint to %s", ckpt_target)
        ckpt_source = Path(
            hf_hub_download(
                repo_id=HABIBI_REPO,
                filename=HABIBI_CKPT_FILENAME,
            ),
        )
        _materialize(ckpt_source, ckpt_target)
    else:
        logger.info("Habibi checkpoint already present at %s", ckpt_target)

    if not vocab_target.exists():
        logger.info("Downloading Habibi vocab to %s", vocab_target)
        vocab_source = Path(
            hf_hub_download(
                repo_id=HABIBI_REPO,
                filename=HABIBI_VOCAB_FILENAME,
            ),
        )
        _materialize(vocab_source, vocab_target)
    else:
        logger.info("Habibi vocab already present at %s", vocab_target)

    return ckpt_target, vocab_target


def _download_chatterbox_assets(root: Path) -> Path:
    from huggingface_hub import hf_hub_download

    chatterbox_dir = root / "chatterbox"
    chatterbox_dir.mkdir(parents=True, exist_ok=True)

    for filename in CHATTERBOX_FILES:
        dest = chatterbox_dir / filename
        if dest.exists():
            continue
        logger.info("Downloading Chatterbox %s to %s", filename, dest)
        source = Path(
            hf_hub_download(
                repo_id=CHATTERBOX_REPO,
                filename=filename,
            ),
        )
        _materialize(source, dest)

    return chatterbox_dir


def ensure_cloner_assets_downloaded() -> ClonerAssetPaths:
    """Download missing cloner weights to disk. Does not load models into memory."""
    global _paths
    if _paths is not None:
        return _paths

    root = cloner_model_root()
    root.mkdir(parents=True, exist_ok=True)
    logger.info("Cloner model root: %s", root)

    vocos_dir = root / "vocos"
    _download_vocos(vocos_dir)

    indicf5_ckpt, indicf5_vocab = _download_indicf5_assets(root)
    habibi_ckpt, habibi_vocab = _download_habibi_assets(root)
    chatterbox_dir = _download_chatterbox_assets(root)

    _paths = ClonerAssetPaths(
        root=root,
        indicf5_ckpt=indicf5_ckpt,
        indicf5_vocab=indicf5_vocab,
        habibi_ckpt=habibi_ckpt,
        habibi_vocab=habibi_vocab,
        chatterbox_dir=chatterbox_dir,
        vocos_dir=vocos_dir,
    )
    return _paths


def get_cloner_asset_paths() -> ClonerAssetPaths:
    """Return resolved asset paths (downloads first if startup hook did not run)."""
    if _paths is None:
        return ensure_cloner_assets_downloaded()
    return _paths

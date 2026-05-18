"""Download and resolve on-disk paths for IndicF5 and XTTS v2 weights (no GPU warmup)."""

from __future__ import annotations

import logging
import os
import shutil
from dataclasses import dataclass
from pathlib import Path

from dotenv import find_dotenv, load_dotenv

from src.constants.cloner import (
    INDICF5_CKPT_FILENAME,
    INDICF5_REPO,
    INDICF5_VOCAB_FILENAME,
    INDICF5_VOCODER_REPO,
)

load_dotenv(find_dotenv(usecwd=True))

logger = logging.getLogger(__name__)

_INDICF5_VOCOS_FILES = ("config.yaml", "pytorch_model.bin")
_XTTS_MODEL_FOLDER = "tts_models--multilingual--multi-dataset--xtts_v2"
_XTTS_REPO = "coqui/XTTS-v2"
_XTTS_FILES = ("model.pth", "config.json", "vocab.json", "hash.md5", "speakers_xtts.pth")

_paths: ClonerAssetPaths | None = None


@dataclass(frozen=True)
class ClonerAssetPaths:
    """Resolved filesystem locations under the cloner model root."""

    root: Path
    indicf5_ckpt: Path
    indicf5_vocab: Path
    indicf5_vocos_dir: Path
    xtts_home: Path


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


def _download_indicf5_assets(root: Path) -> tuple[Path, Path, Path]:
    from huggingface_hub import hf_hub_download

    indicf5_dir = root / "indicf5"
    vocos_dir = indicf5_dir / "vocos"
    indicf5_dir.mkdir(parents=True, exist_ok=True)
    vocos_dir.mkdir(parents=True, exist_ok=True)

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

    for filename in _INDICF5_VOCOS_FILES:
        dest = vocos_dir / filename
        if dest.exists():
            continue
        logger.info("Downloading Vocos %s to %s", filename, dest)
        hf_hub_download(
            repo_id=INDICF5_VOCODER_REPO,
            filename=filename,
            local_dir=str(vocos_dir),
        )

    return ckpt_target, vocab_target, vocos_dir


def _download_xtts_assets(xtts_home: Path) -> None:
    model_dir = xtts_home / "tts" / _XTTS_MODEL_FOLDER
    if model_dir.is_dir() and (model_dir / "config.json").is_file() and (model_dir / "model.pth").is_file():
        logger.info("XTTS v2 model already present at %s", model_dir)
        return

    os.environ["TTS_HOME"] = str(xtts_home)
    model_dir.mkdir(parents=True, exist_ok=True)

    tos_file = model_dir / "tos_agreed.txt"
    if os.environ.get("COQUI_TOS_AGREED") != "1" and not tos_file.exists():
        tos_file.write_text(
            "I have read, understood and agreed to the Terms and Conditions.",
            encoding="utf-8",
        )

    from huggingface_hub import hf_hub_download

    logger.info("Downloading XTTS v2 model to %s", model_dir)
    for filename in _XTTS_FILES:
        dest = model_dir / filename
        if dest.exists():
            continue
        logger.info("Downloading XTTS %s", filename)
        hf_hub_download(
            repo_id=_XTTS_REPO,
            filename=filename,
            local_dir=str(model_dir),
        )


def ensure_cloner_assets_downloaded() -> ClonerAssetPaths:
    """Download missing IndicF5 / XTTS weights to disk. Does not load models into memory."""
    global _paths
    if _paths is not None:
        return _paths

    root = cloner_model_root()
    root.mkdir(parents=True, exist_ok=True)
    logger.info("Cloner model root: %s", root)

    indicf5_ckpt, indicf5_vocab, indicf5_vocos_dir = _download_indicf5_assets(root)
    xtts_home = root / "xtts"
    xtts_home.mkdir(parents=True, exist_ok=True)
    os.environ["TTS_HOME"] = str(xtts_home)
    _download_xtts_assets(xtts_home)

    _paths = ClonerAssetPaths(
        root=root,
        indicf5_ckpt=indicf5_ckpt,
        indicf5_vocab=indicf5_vocab,
        indicf5_vocos_dir=indicf5_vocos_dir,
        xtts_home=xtts_home,
    )
    return _paths


def get_cloner_asset_paths() -> ClonerAssetPaths:
    """Return resolved asset paths (downloads first if startup hook did not run)."""
    if _paths is None:
        return ensure_cloner_assets_downloaded()
    return _paths

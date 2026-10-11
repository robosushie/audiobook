"""Stateless voice-preprocess HTTP service (MMS align, denoise, clip)."""

import asyncio
import base64
import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

# Pin caches and keep this process off the cloner GPU before torch is imported.
_DEVICE = os.environ.get("PREPROCESS_DEVICE", "cpu")
if _DEVICE == "cpu":
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
_MODEL_ROOT = Path(os.environ.get("PREPROCESS_MODEL_DIR", "temp/preprocess-models"))
_MODEL_ROOT.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("HF_HOME", str(_MODEL_ROOT / "huggingface"))
os.environ.setdefault("HF_HUB_CACHE", str(_MODEL_ROOT / "huggingface" / "hub"))
os.environ.setdefault("TORCH_HOME", str(_MODEL_ROOT / "torch"))
os.environ.setdefault("XDG_CACHE_HOME", str(_MODEL_ROOT))

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from src.enums.language import Language
from src.lib.fastapi.routes.health import router as health_router
from src.lib.schemas.fastapi import Middleware
from src.lib.schemas.fastapi import Server as FastAPIServer
from src.lib.schemas.preprocess import PrepareResult
from src.lib.voice.errors import PrepareRejected
from src.lib.voice.prepare import load_prepare_models, prepare_reference

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(name)s: %(message)s",
    force=True,
)

logger = logging.getLogger(__name__)

_server = FastAPIServer(
    title="Audiobook Voice Preprocess",
    description="Align a reading to its passage and return a clean reference clip",
    version="1.0.0",
    base_path="/api",
    enable_docs=True,
)
_middleware = Middleware(
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    """Download aligner, denoiser, and VAD weights, then serve prepare requests."""
    logger.info("Loading preprocess models into %s", _MODEL_ROOT)
    await asyncio.to_thread(load_prepare_models)
    logger.info("Preprocess service ready")
    yield


app = FastAPI(
    title=_server.title,
    description=_server.description,
    version=_server.version,
    docs_url=None,
    redoc_url=None,
    lifespan=lifespan,
)
app.add_middleware(CORSMiddleware, **_middleware.model_dump())

router = APIRouter(prefix=_server.base_path)
router.include_router(health_router)


@router.post("/prepare", response_model=PrepareResult)
async def prepare_voice(
    audio: UploadFile = File(..., description="Raw reading (WAV, M4A, MP3, WebM)"),
    reference_text: str = Form(..., min_length=1, description="Full passage that was read"),
    language: Language = Form(..., description="english | hindi | malayalam | tamil | odia | arabic"),
) -> PrepareResult:
    """Cut and clean a recording so the returned text matches the returned audio."""
    body = await audio.read()
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty audio")
    try:
        prepared = await asyncio.to_thread(
            prepare_reference,
            body,
            reference_text,
            language,
        )
    except PrepareRejected as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.detail) from exc
    except Exception as exc:
        logger.exception("prepare failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Voice preprocess failed",
        ) from exc

    logger.info(
        "prepare complete duration=%.2fs score=%.3f chars=%d",
        prepared.duration,
        prepared.alignment_score,
        len(prepared.reference_text),
    )
    return PrepareResult(
        audio_wav_base64=base64.b64encode(prepared.wav_bytes).decode("ascii"),
        reference_text=prepared.reference_text,
        duration=prepared.duration,
        alignment_score=prepared.alignment_score,
    )


app.include_router(router)

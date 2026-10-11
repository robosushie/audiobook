"""Stateless voice-cloning HTTP service (Chatterbox, IndicF5, Habibi)."""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from src.enums.cloner import ClonerType
from src.enums.language import Language
from src.lib.cloner.assets import ensure_cloner_assets_downloaded
from src.lib.cloner.factory import clone_speech, resolve_cloner_type
from src.lib.fastapi.routes.health import router as health_router
from src.lib.schemas.cloner import CloneRequest
from src.lib.schemas.fastapi import Middleware
from src.lib.schemas.fastapi import Server as FastAPIServer

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s %(name)s: %(message)s",
    force=True,
)

logger = logging.getLogger(__name__)

_server = FastAPIServer(
    title="Audiobook Cloner",
    description="Stateless voice cloning: English Chatterbox, Hindi IndicF5, Arabic Habibi",
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
async def lifespan(_app: FastAPI):
    """Download cloner weights once, then serve clone requests."""
    logger.info("Ensuring cloner assets (Chatterbox, IndicF5, Habibi Unified) are present")
    ensure_cloner_assets_downloaded()
    logger.info("Cloner service ready")
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


@router.get("/cloners")
def list_cloners() -> dict[str, object]:
    """Return language → backend defaults."""
    return {
        "english": ClonerType.CHATTERBOX.value,
        "hindi": ClonerType.INDICF5.value,
        "arabic": ClonerType.HABIBITTS.value,
        "indic": ClonerType.INDICF5.value,
    }


@router.post("/clone")
async def clone_voice(
    reference_audio: UploadFile = File(..., description="Reference clip (WAV/MP3, ~5–20s)"),
    reference_text: str = Form(..., min_length=1, description="Transcript of the reference clip"),
    source_text: str = Form(..., min_length=1, description="Text to speak in the cloned voice"),
    language: Language = Form(..., description="english | hindi | arabic | other Indic slugs"),
    cloner_type: ClonerType | None = Form(default=None, description="Optional backend override"),
) -> Response:
    """Clone ``source_text`` in the reference speaker's voice. Returns a WAV body."""
    audio_bytes = await reference_audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty reference audio")

    backend = resolve_cloner_type(language, cloner_type)
    logger.info(
        "clone request language=%s backend=%s source_chars=%d",
        language.value,
        backend.value,
        len(source_text),
    )
    try:
        result = await asyncio.to_thread(
            clone_speech,
            CloneRequest(
                reference_audio=audio_bytes,
                reference_text=reference_text.strip(),
                source_text=source_text.strip(),
                language=language,
            ),
            cloner_type=cloner_type,
        )
    except Exception as exc:
        logger.exception("clone failed language=%s backend=%s", language.value, backend.value)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    return Response(
        content=result.audio_bytes,
        media_type="audio/wav",
        headers={
            "X-Audio-Duration": f"{result.duration:.3f}",
            "X-Cloner-Type": backend.value,
            "X-Language": language.value,
            "Content-Disposition": 'attachment; filename="clone.wav"',
        },
    )


app.include_router(router)

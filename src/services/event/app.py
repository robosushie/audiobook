"""Event service entry point: health check + Inngest function serve."""

import logging

import inngest.fast_api
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.lib.cloner.assets import ensure_cloner_assets_downloaded
from src.lib.fastapi.routes.health import router as health_router
from src.lib.schemas.fastapi import Middleware
from src.lib.schemas.fastapi import Server as FastAPIServer
from src.services.event.client import inngest_client
from src.services.event.registry import inngest_functions

logger = logging.getLogger(__name__)

_server = FastAPIServer(
    title="Audiobook Event Service",
    description="Inngest background workers (voice preprocess, audiobook generation)",
    version="1.0.0",
    base_path="/api",
    enable_docs=False,
)
_middleware = Middleware(
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("Ensuring IndicF5 and XTTS v2 assets are present on disk")
ensure_cloner_assets_downloaded()

app = FastAPI(
    title=_server.title,
    description=_server.description,
    version=_server.version,
    docs_url=None,
    redoc_url=None,
)
app.add_middleware(CORSMiddleware, **_middleware.model_dump())

router = APIRouter(prefix=_server.base_path)
router.include_router(health_router)
app.include_router(router)

inngest.fast_api.serve(app, inngest_client, inngest_functions)

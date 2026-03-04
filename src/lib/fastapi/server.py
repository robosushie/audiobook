"""FastAPI server."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from src.lib.fastapi.routes.audiobooks import router as audiobooks_router
from src.lib.fastapi.routes.books import router as books_router
from src.lib.fastapi.routes.health import router as health_router
from src.lib.fastapi.routes.voice_profiles import router as voice_profiles_router
from src.lib.fastapi.templates.scalar import DOCS_TEMPLATE
from src.lib.schemas.fastapi import Middleware, Server


def create_server(server: Server, middleware: Middleware) -> tuple[FastAPI, APIRouter]:
    """Create a FastAPI server."""
    app = FastAPI(
        title=server.title,
        description=server.description,
        version=server.version,
        docs_url=None,  # Disable default /docs
        redoc_url=None,
    )

    app.add_middleware(CORSMiddleware, **middleware.model_dump())

    router = APIRouter(prefix=server.base_path)
    router.include_router(health_router)
    router.include_router(books_router)
    router.include_router(voice_profiles_router)
    router.include_router(audiobooks_router)
    # Router will be included in app.py after all routes are added

    if server.enable_docs:

        @app.get("/docs", include_in_schema=False)
        async def docs() -> HTMLResponse:
            """Scalar based documentation."""
            html = DOCS_TEMPLATE.replace("{{title}}", server.title)
            return HTMLResponse(html)

    return app, router

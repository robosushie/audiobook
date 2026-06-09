"""REST API entry point (routes only; Inngest workers live in ``services.event.app``)."""

from fastapi import Depends
from src.enums.auth import AuthRole
from src.lib.auth.clerk import create_authorization
from src.lib.fastapi.server import create_server
from src.lib.schemas.fastapi import Middleware
from src.lib.schemas.fastapi import Server as FastAPI
from src.services.api.routes.audiobooks import router as audiobooks_router
from src.services.api.routes.books import router as books_router
from src.services.api.routes.events import internal_router as events_internal_router
from src.services.api.routes.events import router as events_router
from src.services.api.routes.playbacks import router as playbacks_router
from src.services.api.routes.references import router as references_router
from src.services.api.routes.stats import router as stats_router
from src.services.api.routes.users import router as users_router
from src.services.api.routes.voice import router as voice_router

app, router = create_server(
    FastAPI(
        title="Audiobook API",
        description="FastAPI audiobook API with organized routes",
        version="1.0.0",
        base_path="/api",
        enable_docs=True,
    ),
    Middleware(
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
)

user_auth = create_authorization(required_roles={AuthRole.ADMIN, AuthRole.REGULAR})
admin_auth = create_authorization(required_roles={AuthRole.ADMIN})

app.include_router(router)
app.include_router(
    stats_router,
    prefix="/api",
    dependencies=[Depends(admin_auth)],
)
app.include_router(
    users_router,
    prefix="/api",
    dependencies=[Depends(admin_auth)],
)
app.include_router(
    books_router,
    prefix="/api",
    dependencies=[Depends(user_auth)],
)
app.include_router(
    references_router,
    prefix="/api",
    dependencies=[Depends(user_auth)],
)
app.include_router(
    voice_router,
    prefix="/api",
    dependencies=[Depends(user_auth)],
)
app.include_router(
    audiobooks_router,
    prefix="/api",
    dependencies=[Depends(user_auth)],
)
app.include_router(
    playbacks_router,
    prefix="/api",
    dependencies=[Depends(user_auth)],
)
app.include_router(events_internal_router)
app.include_router(
    events_router,
    prefix="/api",
    dependencies=[Depends(user_auth)],
)

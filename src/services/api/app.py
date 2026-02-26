"""Main platform app routes."""

# from fastapi import Depends
# from src.apps.platform.routes.pulse import router as pulse_router
# from src.apps.platform.routes.users import router as user_router
from src.enums.auth import ClerkRole
from src.lib.auth.clerk import create_authorization
from src.lib.fastapi.server import create_server
from src.lib.schemas.fastapi import Middleware
from src.lib.schemas.fastapi import Server as FastAPI

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

auth = create_authorization(required_roles={ClerkRole.REGULAR, ClerkRole.ADMIN})

# Include router after all routes are added so OpenAPI picks them up
app.include_router(router)

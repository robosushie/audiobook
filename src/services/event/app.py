"""Event service entry point: health check + Inngest function serve."""

import inngest.fast_api

from src.lib.fastapi.server import create_server
from src.lib.schemas.fastapi import Middleware
from src.lib.schemas.fastapi import Server as FastAPI
from src.services.event.client import inngest_client
from src.services.event.registry import inngest_functions

app, router = create_server(
    FastAPI(
        title="Audiobook Event Service",
        description="Inngest background workers (voice preprocess, audiobook generation)",
        version="1.0.0",
        base_path="/api",
        enable_docs=False,
    ),
    Middleware(
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
)

app.include_router(router)

inngest.fast_api.serve(app, inngest_client, inngest_functions)

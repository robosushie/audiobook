"""FastAPI schemas."""

from pydantic import BaseModel


class Middleware(BaseModel):
    """Middleware configuration schema."""

    allow_origins: list[str]
    allow_credentials: bool
    allow_methods: list[str]
    allow_headers: list[str]


class Server(BaseModel):
    """FastAPI server schema."""

    title: str
    description: str
    version: str
    base_path: str
    enable_docs: bool

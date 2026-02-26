"""Health API route."""

from datetime import datetime
from typing import Any

from fastapi import APIRouter

TAG = "Health"
router = APIRouter()


@router.get("/health", tags=[TAG], name="Health check")
def health_check() -> dict[str, Any]:
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

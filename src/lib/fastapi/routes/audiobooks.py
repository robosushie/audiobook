"""Audiobooks API routes. Full CRUD for admin and regular users."""

from typing import Any

from fastapi import APIRouter, Depends

from src.enums.auth import ClerkRole
from src.lib.auth.clerk import create_authorization

TAG = "Audiobooks"
router = APIRouter(prefix="/audiobooks", tags=[TAG])

auth = create_authorization(required_roles={ClerkRole.ADMIN, ClerkRole.REGULAR})


@router.get("/", name="List audiobooks")
def list_audiobooks(_: None = Depends(auth)) -> dict[str, Any]:
    """List all audiobooks. Allowed for admin and regular users."""
    return {"success": True}


@router.get("/{audiobook_id}", name="Get audiobook")
def get_audiobook(audiobook_id: str, _: None = Depends(auth)) -> dict[str, Any]:
    """Get an audiobook by id."""
    return {"success": True, "id": audiobook_id}


@router.post("/", name="Create audiobook")
def create_audiobook(_: None = Depends(auth)) -> dict[str, Any]:
    """Create an audiobook."""
    return {"success": True}


@router.put("/{audiobook_id}", name="Update audiobook")
def update_audiobook(audiobook_id: str, _: None = Depends(auth)) -> dict[str, Any]:
    """Update an audiobook."""
    return {"success": True, "id": audiobook_id}


@router.delete("/{audiobook_id}", name="Delete audiobook")
def delete_audiobook(audiobook_id: str, _: None = Depends(auth)) -> dict[str, Any]:
    """Delete an audiobook."""
    return {"success": True, "id": audiobook_id}

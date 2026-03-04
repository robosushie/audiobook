"""Voice profiles/samples API routes. Full CRUD for admin and regular users."""

from typing import Any

from fastapi import APIRouter, Depends

from src.enums.auth import ClerkRole
from src.lib.auth.clerk import create_authorization

TAG = "Voice profiles"
router = APIRouter(prefix="/voice-profiles", tags=[TAG])

auth = create_authorization(required_roles={ClerkRole.ADMIN, ClerkRole.REGULAR})


@router.get("/", name="List voice profiles")
def list_voice_profiles(_: None = Depends(auth)) -> dict[str, Any]:
    """List all voice profiles. Allowed for admin and regular users."""
    return {"success": True}


@router.get("/{profile_id}", name="Get voice profile")
def get_voice_profile(profile_id: str, _: None = Depends(auth)) -> dict[str, Any]:
    """Get a voice profile by id."""
    return {"success": True, "id": profile_id}


@router.post("/", name="Create voice profile")
def create_voice_profile(_: None = Depends(auth)) -> dict[str, Any]:
    """Create a voice profile."""
    return {"success": True}


@router.put("/{profile_id}", name="Update voice profile")
def update_voice_profile(profile_id: str, _: None = Depends(auth)) -> dict[str, Any]:
    """Update a voice profile."""
    return {"success": True, "id": profile_id}


@router.delete("/{profile_id}", name="Delete voice profile")
def delete_voice_profile(profile_id: str, _: None = Depends(auth)) -> dict[str, Any]:
    """Delete a voice profile."""
    return {"success": True, "id": profile_id}

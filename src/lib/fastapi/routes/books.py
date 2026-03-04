"""Books API routes. Admin: full CRUD. Regular users: read only."""

from typing import Any

from fastapi import APIRouter, Depends

from src.enums.auth import ClerkRole
from src.lib.auth.clerk import create_authorization

TAG = "Books"
router = APIRouter(prefix="/books", tags=[TAG])

auth_read = create_authorization(required_roles={ClerkRole.ADMIN, ClerkRole.REGULAR})
auth_admin = create_authorization(required_roles={ClerkRole.ADMIN})


@router.get("/", name="List books")
def list_books(_: None = Depends(auth_read)) -> dict[str, Any]:
    """List all books. Allowed for admin and regular users."""
    return {"success": True}


@router.get("/{book_id}", name="Get book")
def get_book(book_id: str, _: None = Depends(auth_read)) -> dict[str, Any]:
    """Get a book by id. Allowed for admin and regular users."""
    return {"success": True, "id": book_id}


@router.post("/", name="Create book")
def create_book(_: None = Depends(auth_admin)) -> dict[str, Any]:
    """Create a book. Admin only."""
    return {"success": True}


@router.put("/{book_id}", name="Update book")
def update_book(book_id: str, _: None = Depends(auth_admin)) -> dict[str, Any]:
    """Update a book. Admin only."""
    return {"success": True, "id": book_id}


@router.delete("/{book_id}", name="Delete book")
def delete_book(book_id: str, _: None = Depends(auth_admin)) -> dict[str, Any]:
    """Delete a book. Admin only."""
    return {"success": True, "id": book_id}

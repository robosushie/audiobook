"""Shared reference passage API routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.lib.db import get_session
from src.lib.error import (
    REFERENCE_DUPLICATE,
    REFERENCE_IN_USE,
    REFERENCE_NOT_FOUND,
)
from src.lib.feature.reference.passages import get_or_create_reference
from src.models.content.reference import (
    Reference,
    ReferenceCreate,
    ReferenceDelete,
    ReferenceRead,
    ReferenceUpdate,
)
from src.models.content.voice import Voice

TAG = "References"
router = APIRouter(prefix="/references", tags=[TAG])


async def _get_reference_or_404(reference_id: UUID, session: AsyncSession) -> Reference:
    result = await session.execute(select(Reference).where(Reference.id == reference_id))
    reference = result.scalar_one_or_none()
    if not reference:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=REFERENCE_NOT_FOUND)
    return reference


@router.get("", name="List references (no slash)", response_model=list[ReferenceRead], include_in_schema=False)
@router.get("/", name="List references", response_model=list[ReferenceRead])
async def list_references(
    session: AsyncSession = Depends(get_session),
) -> list[ReferenceRead]:
    """List all shared reference passages."""
    result = await session.execute(select(Reference).order_by(Reference.created_at.desc()))
    return [ReferenceRead.model_validate(r) for r in result.scalars().all()]


@router.get("/{reference_id}", name="Get reference", response_model=ReferenceRead)
async def get_reference(
    reference_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ReferenceRead:
    """Get a reference passage by id."""
    reference = await _get_reference_or_404(reference_id, session)
    return ReferenceRead.model_validate(reference)


@router.post("/", name="Create reference", response_model=ReferenceRead, status_code=status.HTTP_201_CREATED)
async def create_reference(
    body: ReferenceCreate,
    session: AsyncSession = Depends(get_session),
) -> ReferenceRead:
    """Create or return existing reference (deduped by text + language)."""
    reference = await get_or_create_reference(
        text=body.text,
        language=body.language,
        session=session,
    )
    return ReferenceRead.model_validate(reference)


@router.patch("/{reference_id}", name="Update reference", response_model=ReferenceRead)
async def update_reference(
    reference_id: UUID,
    body: ReferenceUpdate,
    session: AsyncSession = Depends(get_session),
) -> ReferenceRead:
    """Update a reference passage. Admin only."""
    reference = await _get_reference_or_404(reference_id, session)
    update_data = body.model_dump(exclude_unset=True)
    if "text" in update_data and update_data["text"] is not None:
        update_data["text"] = update_data["text"].strip()

    next_text = update_data.get("text", reference.text)
    next_language = update_data.get("language", reference.language)

    if next_text != reference.text or next_language != reference.language:
        duplicate = await session.execute(
            select(Reference).where(
                Reference.text == next_text,
                Reference.language == next_language,
                Reference.id != reference_id,
            ),
        )
        if duplicate.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=REFERENCE_DUPLICATE,
            )

    for key, value in update_data.items():
        setattr(reference, key, value)
    await session.flush()
    await session.refresh(reference)
    return ReferenceRead.model_validate(reference)


@router.delete("/{reference_id}", name="Delete reference", response_model=ReferenceDelete)
async def delete_reference(
    reference_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> ReferenceDelete:
    """Delete a reference passage. Fails if linked to voice profiles."""
    reference = await _get_reference_or_404(reference_id, session)
    in_use = await session.execute(
        select(func.count()).select_from(Voice).where(Voice.reference_id == reference_id),
    )
    if (in_use.scalar() or 0) > 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=REFERENCE_IN_USE)
    await session.delete(reference)
    await session.flush()
    return ReferenceDelete(id=reference_id)

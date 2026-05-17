"""Shared reference passage helpers."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.language import Language
from src.models.content.reference import Reference


async def get_or_create_reference(
    *,
    text: str,
    language: Language,
    session: AsyncSession,
) -> Reference:
    """Return existing reference with same text+language, or insert a new row."""
    normalized = text.strip()
    result = await session.execute(
        select(Reference).where(
            Reference.text == normalized,
            Reference.language == language,
        ),
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing

    reference = Reference(text=normalized, language=language)
    session.add(reference)
    await session.flush()
    await session.refresh(reference)
    return reference

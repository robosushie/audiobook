"""Voice profiles/samples API routes. Full CRUD for admin and regular users."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.enums.auth import AuthRole
from src.enums.language import Language
from src.lib.db import get_session
from src.lib.error import (
    REFERENCE_ID_OR_TEXT_REQUIRED,
    VOICE_EMPTY_FILE,
    VOICE_EXPECTED_AUDIO,
    VOICE_PROCESSING_FAILED,
    VOICE_PROFILE_NOT_FOUND,
    VOICE_USER_NOT_FOUND,
)
from src.lib.voice.preprocess import create_queued_voice_profile
from src.services.event.enqueue import enqueue_voice_preprocess
from src.models.content.voice import Voice, VoiceCreate, VoiceRead, VoiceUpdate
from src.models.user.user import User

TAG = "Voice profiles"
router = APIRouter(prefix="/voice-profiles", tags=[TAG])


@router.get("", name="List voice profiles (no slash)", response_model=list[VoiceRead], include_in_schema=False)
@router.get("/", name="List voice profiles", response_model=list[VoiceRead])
async def list_voice_profiles(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[VoiceRead]:
    """List voice profiles. Admins see all; regular users see only their own."""
    credentials = request.state.credentials
    if credentials.role == AuthRole.REGULAR:
        user_result = await session.execute(select(User).where(User.auth_id == credentials.id))
        user = user_result.scalar_one_or_none()
        if not user:
            return []
        result = await session.execute(
            select(Voice).where(Voice.user_id == user.id).order_by(Voice.created_at.desc())
        )
    else:
        result = await session.execute(select(Voice).order_by(Voice.created_at.desc()))
    profiles = result.scalars().all()
    return [VoiceRead.model_validate(p) for p in profiles]


@router.get("/{profile_id}", name="Get voice profile", response_model=VoiceRead)
async def get_voice_profile(
    profile_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> VoiceRead:
    """Get a voice profile by id."""
    result = await session.execute(select(Voice).where(Voice.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=VOICE_PROFILE_NOT_FOUND)
    return VoiceRead.model_validate(profile)


@router.post("/upload", name="Upload voice sample", response_model=VoiceRead, status_code=status.HTTP_202_ACCEPTED)
async def upload_voice_profile(
    request: Request,
    file: UploadFile = File(..., description="Audio file (WAV preferred)"),
    name: str = Form(..., description="Profile label"),
    reference_text: str | None = Form(
        None,
        description="Passage read aloud; deduped into shared reference table",
    ),
    reference_id: UUID | None = Form(
        None,
        description="Existing reference row (alternative to reference_text)",
    ),
    language: Language | None = Form(
        None,
        description="Required with reference_text; ignored when reference_id is set",
    ),
    session: AsyncSession = Depends(get_session),
) -> VoiceRead:
    """Upload raw voice audio; preprocessing runs asynchronously via Inngest."""
    clerk_id = request.state.credentials.id
    result = await session.execute(select(User).where(User.auth_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=VOICE_USER_NOT_FOUND,
        )
    content_type = file.content_type or ""
    if "audio" not in content_type and not (file.filename or "").lower().endswith((".wav", ".wave", ".mp3", ".m4a", ".ogg")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=VOICE_EXPECTED_AUDIO,
        )
    body = await file.read()
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=VOICE_EMPTY_FILE)
    if reference_id is None and not (reference_text and reference_text.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=REFERENCE_ID_OR_TEXT_REQUIRED,
        )
    if reference_id is None and language is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=REFERENCE_ID_OR_TEXT_REQUIRED,
        )
    try:
        profile = await create_queued_voice_profile(
            voice_data=body,
            name=name.strip(),
            user_id=user.id,
            reference_id=reference_id,
            reference_text=reference_text.strip() if reference_text else None,
            language=language,
            session=session,
        )
        await enqueue_voice_preprocess(profile_id=profile.id, user_id=user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=VOICE_PROCESSING_FAILED.format(error=e),
        ) from e
    return VoiceRead.model_validate(profile)


@router.post("/", name="Create voice profile", response_model=VoiceRead, status_code=status.HTTP_201_CREATED)
async def create_voice_profile(
    body: VoiceCreate,
    session: AsyncSession = Depends(get_session),
) -> VoiceRead:
    """Create a voice profile (e.g. admin with precomputed audio_url)."""
    profile = Voice.model_validate(body)
    session.add(profile)
    await session.flush()
    await session.refresh(profile)
    return VoiceRead.model_validate(profile)


@router.put("/{profile_id}", name="Update voice profile", response_model=VoiceRead)
async def update_voice_profile(
    profile_id: UUID,
    body: VoiceUpdate,
    session: AsyncSession = Depends(get_session),
) -> VoiceRead:
    """Update a voice profile."""
    result = await session.execute(select(Voice).where(Voice.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=VOICE_PROFILE_NOT_FOUND)
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    await session.flush()
    await session.refresh(profile)
    return VoiceRead.model_validate(profile)


@router.delete("/{profile_id}", name="Delete voice profile", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voice_profile(
    profile_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a voice profile."""
    result = await session.execute(select(Voice).where(Voice.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=VOICE_PROFILE_NOT_FOUND)
    await session.delete(profile)
    return None

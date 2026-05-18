"""Voice profiles/samples API routes. Full CRUD for admin and regular users."""

from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
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
from src.models.content.reference import Reference
from src.models.content.voice import Voice, VoiceCreate, VoiceRead, VoiceUpdate
from src.models.user.user import User
from src.services.event.enqueue import enqueue_voice_preprocess

TAG = "Voice profiles"
router = APIRouter(prefix="/voice-profiles", tags=[TAG])


class VoiceWithLanguageRead(VoiceRead):
    """Voice profile list item with reference language."""

    language: Language


async def _current_user(request: Request, session: AsyncSession) -> User:
    """Resolve the signed-in Clerk user to a DB row."""
    clerk_id = request.state.credentials.id
    result = await session.execute(select(User).where(User.auth_id == clerk_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=VOICE_USER_NOT_FOUND,
        )
    return user


@router.get(
    "",
    name="List voice profiles (no slash)",
    response_model=list[VoiceWithLanguageRead],
    include_in_schema=False,
)
@router.get("/", name="List voice profiles", response_model=list[VoiceWithLanguageRead])
async def list_voice_profiles(
    request: Request,
    language: Language | None = Query(
        default=None, description="Filter by reference language"
    ),
    session: AsyncSession = Depends(get_session),
) -> list[VoiceWithLanguageRead]:
    """List voice profiles for the signed-in user."""
    user = await _current_user(request, session)
    stmt = (
        select(Voice, Reference.language)
        .join(Reference, Voice.reference_id == Reference.id)
        .where(Voice.user_id == user.id)
        .order_by(Voice.created_at.desc())
    )
    if language is not None:
        stmt = stmt.where(Reference.language == language)

    result = await session.execute(stmt)
    out: list[VoiceWithLanguageRead] = []
    for voice, ref_language in result.all():
        out.append(
            VoiceWithLanguageRead(
                **VoiceRead.model_validate(voice).model_dump(),
                language=ref_language,
            ),
        )
    return out


@router.get("/{profile_id}", name="Get voice profile", response_model=VoiceRead)
async def get_voice_profile(
    profile_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> VoiceRead:
    """Get a voice profile by id."""
    result = await session.execute(select(Voice).where(Voice.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=VOICE_PROFILE_NOT_FOUND
        )
    return VoiceRead.model_validate(profile)


@router.post(
    "/upload",
    name="Upload voice sample",
    response_model=VoiceRead,
    status_code=status.HTTP_202_ACCEPTED,
)
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
    user = await _current_user(request, session)
    content_type = file.content_type or ""
    if "audio" not in content_type and not (file.filename or "").lower().endswith(
        (".wav", ".wave", ".mp3", ".m4a", ".ogg", ".webm"),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=VOICE_EXPECTED_AUDIO,
        )
    body = await file.read()
    if not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=VOICE_EMPTY_FILE
        )
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


@router.post(
    "/",
    name="Create voice profile",
    response_model=VoiceRead,
    status_code=status.HTTP_201_CREATED,
)
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=VOICE_PROFILE_NOT_FOUND
        )
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    await session.flush()
    await session.refresh(profile)
    return VoiceRead.model_validate(profile)


@router.delete(
    "/{profile_id}", name="Delete voice profile", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_voice_profile(
    profile_id: UUID,
    session: AsyncSession = Depends(get_session),
) -> None:
    """Delete a voice profile."""
    result = await session.execute(select(Voice).where(Voice.id == profile_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=VOICE_PROFILE_NOT_FOUND
        )
    await session.delete(profile)

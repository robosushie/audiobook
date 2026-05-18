"""Voice (voice profile) models — table + Pydantic read/write variants."""

from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel
from src.constants.model import ORM_METADATA
from src.enums.media import VoiceProfileStatus
from src.models.common import TimestampMixin


class VoiceBase(SQLModel):
    """Fields shared by all voice profile schemas."""

    label: str = Field(max_length=128)
    raw_text: str = Field(description="Snapshot of reference.text at upload time")
    duration: float = Field(default=0.0, ge=0.0)


class VoiceCreate(VoiceBase):
    """Payload for creating a voice profile (admin / pre-seeded)."""

    user_id: UUID
    reference_id: UUID
    raw_url: str | None = None
    audio_url: str | None = None
    audio_text: str | None = None


class VoiceUpdate(SQLModel):
    """PATCH-safe update fields."""

    label: str | None = None
    status: VoiceProfileStatus | None = None
    audio_url: str | None = None
    audio_text: str | None = None


class VoiceDelete(SQLModel):
    """Confirmation payload returned after deleting a voice profile."""

    id: UUID
    deleted: bool = True


class VoiceRead(VoiceBase):
    """API response representation of a voice profile."""

    id: UUID
    user_id: UUID
    reference_id: UUID
    raw_url: str | None = None
    audio_url: str | None = None
    audio_text: str | None = None
    status: VoiceProfileStatus


class Voice(VoiceBase, TimestampMixin, table=True):
    """User-recorded voice clip linked to a shared reference passage."""

    metadata = ORM_METADATA
    __tablename__ = "voice"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="users.id", index=True)
    reference_id: UUID = Field(foreign_key="reference.id", index=True)

    raw_url: str | None = Field(default=None, max_length=2048)
    audio_url: str | None = Field(default=None, max_length=2048)
    audio_text: str | None = Field(default=None)

    status: VoiceProfileStatus = Field(default=VoiceProfileStatus.QUEUED)

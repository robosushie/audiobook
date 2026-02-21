"""VoiceProfile models — table + Pydantic read/write variants."""

from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.enums.media import VoiceProfileStatus
from src.models.common import TimestampMixin


class VoiceProfileBase(SQLModel):
    """Fields shared by all voice profile schemas."""

    label: str = Field(max_length=128)
    language: str = Field(max_length=16)
    content_url: str = Field(max_length=2048)
    reference_text: str | None = Field(default=None)
    duration: float


class VoiceProfileCreate(VoiceProfileBase):
    """Payload for uploading a new voice profile."""

    user_id: UUID


class VoiceProfileUpdate(SQLModel):
    """PATCH-safe update fields."""

    label: str | None = None
    reference_text: str | None = None
    status: VoiceProfileStatus | None = None


class VoiceProfileDelete(SQLModel):
    """Confirmation payload returned after deleting a voice profile."""

    id: UUID
    deleted: bool = True


class VoiceProfileRead(VoiceProfileBase):
    """API response representation of a voice profile."""

    id: UUID
    user_id: UUID
    status: VoiceProfileStatus


class VoiceProfile(TimestampMixin, VoiceProfileBase, table=True):
    """User-recorded voice clip used as the cloning reference."""

    __tablename__ = "voice_profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="users.id", index=True)

    status: VoiceProfileStatus = Field(default=VoiceProfileStatus.UPLOADED)

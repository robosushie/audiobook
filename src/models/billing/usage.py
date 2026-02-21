"""Usage models — table + Pydantic read/write variants."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlmodel import DateTime, Field, SQLModel
from src.enums.billing import PlanAudiobookLimit, SubscriptionPlan


class UsageBase(SQLModel):
    """Fields shared by all usage schemas."""

    period_start: datetime = Field(sa_type=DateTime(timezone=True))
    period_end: datetime = Field(sa_type=DateTime(timezone=True))
    audiobooks_generated: int = Field(default=0, ge=0)
    audiobooks_limit: int
    reset_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))


class UsageCreate(UsageBase):
    """Payload for creating a new usage record at the start of a billing period."""

    user_id: UUID

    @classmethod
    def for_plan(
        cls,
        user_id: UUID,
        plan: SubscriptionPlan,
        period_start: datetime,
        period_end: datetime,
    ) -> "UsageCreate":
        """Resolve the audiobook limit from the plan enum and return a new instance."""
        return cls(
            user_id=user_id,
            period_start=period_start,
            period_end=period_end,
            audiobooks_limit=PlanAudiobookLimit.for_plan(plan),
        )


class UsageUpdate(SQLModel):
    """PATCH-safe update fields — incremented by the generation worker."""

    audiobooks_generated: int | None = None
    reset_at: datetime | None = None
    audiobooks_limit: int | None = None


class UsageDelete(SQLModel):
    """Confirmation payload returned after deleting a usage record."""

    id: UUID
    deleted: bool = True


class UsageRead(UsageBase):
    """API response representation of a usage record."""

    id: UUID
    user_id: UUID
    remaining: int = 0


class Usage(UsageBase, table=True):
    """Per-user usage counters for a single billing period."""

    __tablename__ = "usages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="users.id", index=True)

    @property
    def remaining(self) -> int:
        """Audiobooks the user can still generate this period."""
        return max(0, self.audiobooks_limit - self.audiobooks_generated)

    @property
    def is_exhausted(self) -> bool:
        """True when the user has hit their generation limit."""
        return self.audiobooks_generated >= self.audiobooks_limit

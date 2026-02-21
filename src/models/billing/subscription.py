"""Subscription models — table + Pydantic read/write variants."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime
from sqlmodel import Field, SQLModel

from src.enums.billing import PaymentProvider, SubscriptionPlan, SubscriptionStatus
from src.models.common import TimestampMixin


class SubscriptionBase(SQLModel):
    """Fields shared by all subscription schemas."""

    external_customer_id: str = Field(max_length=128)
    external_subscription_id: str = Field(max_length=128)
    payment_provider: PaymentProvider
    plan: SubscriptionPlan = Field(default=SubscriptionPlan.FREE)
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE)
    current_period_start: datetime = Field(
        sa_column_kwargs={"type_": DateTime(timezone=True)},
    )
    current_period_end: datetime = Field(
        sa_column_kwargs={"type_": DateTime(timezone=True)},
    )


class SubscriptionCreate(SubscriptionBase):
    """Payload for creating a new subscription record (e.g. from a webhook)."""

    user_id: UUID


class SubscriptionUpdate(SQLModel):
    """PATCH-safe update fields — driven by payment provider webhooks."""

    plan: SubscriptionPlan | None = None
    status: SubscriptionStatus | None = None
    current_period_start: datetime | None = None
    current_period_end: datetime | None = None
    external_subscription_id: str | None = None


class SubscriptionDelete(SQLModel):
    """Confirmation payload returned after deleting a subscription record."""

    id: UUID
    deleted: bool = True


class SubscriptionRead(SubscriptionBase):
    """API response representation of a subscription."""

    id: UUID
    user_id: UUID


class Subscription(TimestampMixin, SubscriptionBase, table=True):
    """A user's billing subscription to the platform."""

    __tablename__ = "subscriptions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    user_id: UUID = Field(foreign_key="users.id", index=True)

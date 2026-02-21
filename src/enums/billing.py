"""Billing and subscription enums."""

from enum import IntEnum, StrEnum


class PaymentProvider(StrEnum):
    """Supported payment gateway providers."""

    STRIPE = "stripe"
    RAZORPAY = "razorpay"
    JUSPAY = "juspay"


class SubscriptionPlan(StrEnum):
    """Available subscription tiers."""

    FREE = "free"
    PRO = "pro"
    PREMIUM = "premium"


class SubscriptionStatus(StrEnum):
    """Lifecycle status of a subscription."""

    ACTIVE = "active"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"


class PlanAudiobookLimit(IntEnum):
    """Maximum number of audiobooks a user may generate per billing period per plan."""

    FREE = 5
    PRO = 25
    PREMIUM = 100

    @classmethod
    def for_plan(cls, plan: SubscriptionPlan) -> int:
        """Return the audiobook limit for a given subscription plan."""
        return cls[plan.upper()].value

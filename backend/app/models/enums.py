"""Status enums from the blueprint (section 10.4).

Stored as VARCHAR (native_enum=False) so adding a value never needs an ALTER TYPE
migration, and the same schema works on SQLite and Postgres.
"""

from enum import StrEnum

from sqlalchemy import Enum as SAEnum


def str_enum(enum_cls: type[StrEnum]) -> SAEnum:
    return SAEnum(
        enum_cls,
        native_enum=False,
        length=32,
        values_callable=lambda e: [m.value for m in e],
        validate_strings=True,
    )


class RoleName(StrEnum):
    CUSTOMER = "customer"
    TAILOR = "tailor"
    SELLER = "seller"
    DELIVERY = "delivery"
    ADMIN = "admin"


class Locale(StrEnum):
    AR = "ar"
    EN = "en"


class VerificationLevel(StrEnum):
    NONE = "none"
    IDENTITY = "identity"
    PROFESSIONAL = "professional"
    BUSINESS = "business"
    PREMIUM = "premium"


class RequestStatus(StrEnum):
    DRAFT = "draft"
    OPEN = "open"
    QUOTES_RECEIVED = "quotes_received"
    TAILOR_SELECTED = "tailor_selected"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"


class OrderStatus(StrEnum):
    PENDING_PAYMENT = "pending_payment"
    CONFIRMED = "confirmed"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    AT_TAILOR = "at_tailor"
    IN_PROGRESS = "in_progress"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


class QuoteStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    WITHDRAWN = "withdrawn"


class BookingServiceType(StrEnum):
    SHOP_VISIT = "shop_visit"
    VAN_PICKUP = "van_pickup"
    HOME_SERVICE = "home_service"
    QUICK_FIX = "quick_fix"


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PAID = "paid"


class DisputeStatus(StrEnum):
    OPEN = "open"
    UNDER_REVIEW = "under_review"
    WAITING_CUSTOMER = "waiting_customer"
    WAITING_TAILOR = "waiting_tailor"
    RESOLVED = "resolved"
    CLOSED = "closed"

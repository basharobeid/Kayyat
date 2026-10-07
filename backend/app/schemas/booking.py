import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.enums import BookingServiceType, PaymentStatus
from app.schemas.common import Money
from app.schemas.tailor import _validate_city


class RecommendRequest(BaseModel):
    description: str = Field(default="", max_length=2000)
    quick_items: list[str] = Field(default_factory=list, max_length=6)
    prefers_home: bool = False


class Recommendation(BaseModel):
    service_type: BookingServiceType
    reason_ar: str
    reason_en: str


class SlotRead(BaseModel):
    slot: str
    available: bool


class BookingCreate(BaseModel):
    service_type: BookingServiceType
    description: str = Field(default="", max_length=2000)
    garment: str | None = Field(default=None, max_length=40)
    quick_items: list[str] = Field(default_factory=list, max_length=6)
    photo_urls: list[str] = Field(default_factory=list, max_length=6)
    city: str = "damascus"
    district: str | None = Field(default=None, max_length=80)
    address_line: str | None = Field(default=None, max_length=200)
    contact_phone: str | None = Field(default=None, max_length=20)
    scheduled_date: date
    slot: str = Field(pattern=r"^\d{2}:\d{2}$")
    followed_recommendation: bool = False

    _city = field_validator("city")(_validate_city)

    @field_validator("contact_phone")
    @classmethod
    def _phone(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        digits = "".join(ch for ch in v if ch.isdigit())
        if not 7 <= len(digits) <= 15:
            raise ValueError("Enter a valid phone number")
        return v.strip()


class BookingEventRead(BaseModel):
    status: str
    note: str | None
    created_at: datetime


class PipelineStep(BaseModel):
    status: str
    reached_at: datetime | None
    current: bool


class BookingRead(BaseModel):
    id: uuid.UUID
    reference: str
    service_type: BookingServiceType
    status: str
    description: str
    garment: str | None
    quick_items: list[str]
    photo_urls: list[str]
    city: str
    district: str | None
    address_line: str | None
    contact_phone: str | None
    scheduled_date: date
    slot: str
    visit_fee_usd: Money
    estimate_min_usd: Money | None
    estimate_max_usd: Money | None
    final_price_usd: Money | None
    payment_status: PaymentStatus
    paid_at: datetime | None
    assignee_name: str | None
    rating: int | None
    review_comment: str | None
    cancel_reason: str | None
    created_at: datetime
    completed_at: datetime | None
    pipeline: list[PipelineStep]
    events: list[BookingEventRead]
    next_status: str | None = None
    can_cancel: bool = False
    can_review: bool = False
    customer_name: str | None = None
    shop_address: str | None = None


class StaffAdvance(BaseModel):
    note: str | None = Field(default=None, max_length=300)
    assignee_name: str | None = Field(default=None, max_length=80)


class CancelRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=300)


class PriceUpdate(BaseModel):
    final_price_usd: Decimal = Field(gt=0, max_digits=8, decimal_places=2)


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class SupportMessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
    photo_url: str | None = Field(default=None, max_length=500)
    booking_id: uuid.UUID | None = None

    @field_validator("body")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        return v


class SupportMessageRead(BaseModel):
    id: uuid.UUID
    body: str
    photo_url: str | None
    booking_id: uuid.UUID | None
    from_staff: bool
    created_at: datetime


class SupportThread(BaseModel):
    customer_id: uuid.UUID
    customer_name: str
    last_message: str
    last_at: datetime
    last_from_staff: bool


class BookingOptions(BaseModel):
    """Everything the booking UI needs to render prices and choices."""

    usd_to_syp: int
    service_cities: list[str]
    shop_address: str | None
    visit_fees_usd: dict[str, Money]
    quick_items_usd: dict[str, list[Money]]
    slots: dict[str, list[str]]
    closed_weekday: int
    horizon_days: int
    google_client_id: str | None

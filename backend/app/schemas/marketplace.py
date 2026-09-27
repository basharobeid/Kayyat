import uuid
from datetime import UTC, date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.core.storage import is_own_media_url
from app.models.enums import OrderStatus, QuoteStatus, RequestStatus
from app.schemas.catalog import ServiceRead
from app.schemas.common import Money, UserBrief
from app.schemas.tailor import TailorBrief, _validate_city
from app.schemas.user import AddressRead


class RequestCreate(BaseModel):
    service_id: int | None = None
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=2000)
    city: str
    address_id: uuid.UUID | None = None
    preferred_date: date | None = None
    budget_max: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    needs_pickup: bool = False
    needs_delivery: bool = False
    photo_urls: list[str] = Field(default_factory=list, max_length=6)

    _city = field_validator("city")(_validate_city)

    @field_validator("photo_urls")
    @classmethod
    def _own_media(cls, v: list[str]) -> list[str]:
        if not all(is_own_media_url(u) for u in v):
            raise ValueError("Photos must be uploaded through /media/images first")
        return v

    @field_validator("preferred_date")
    @classmethod
    def _not_in_past(cls, v: date | None) -> date | None:
        if v is not None and v < datetime.now(UTC).date():
            raise ValueError("Preferred date cannot be in the past")
        return v


class QuoteCreate(BaseModel):
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    duration_days: int = Field(ge=1, le=90)
    offers_pickup: bool = False
    offers_delivery: bool = False
    message: str | None = Field(default=None, max_length=1000)


class QuoteRead(BaseModel):
    id: uuid.UUID
    request_id: uuid.UUID
    tailor: TailorBrief
    price: Money
    duration_days: int
    offers_pickup: bool
    offers_delivery: bool
    message: str | None
    status: QuoteStatus
    created_at: datetime
    conversation_id: uuid.UUID | None = None
    request_title: str | None = None
    request_status: RequestStatus | None = None


class RequestRead(BaseModel):
    id: uuid.UUID
    title: str
    description: str
    city: str
    service: ServiceRead | None
    preferred_date: date | None
    budget_max: Money | None
    needs_pickup: bool
    needs_delivery: bool
    photo_urls: list[str]
    status: RequestStatus
    created_at: datetime
    customer: UserBrief
    quote_count: int
    # Owner sees all quotes; a tailor sees only their own (my_quote).
    quotes: list[QuoteRead] | None = None
    my_quote: QuoteRead | None = None
    order_id: uuid.UUID | None = None
    is_owner: bool = False


class OrderEventRead(BaseModel):
    status: OrderStatus
    note: str | None
    created_at: datetime


class OrderRead(BaseModel):
    id: uuid.UUID
    reference: str
    title: str
    request_id: uuid.UUID
    price: Money
    commission_amount: Money | None  # only shown to the tailor and admins
    tailor_payout: Money | None
    payment_method: str
    pickup: bool
    delivery: bool
    due_date: date
    status: OrderStatus
    created_at: datetime
    completed_at: datetime | None
    customer: UserBrief
    tailor: TailorBrief
    address: AddressRead | None = None
    events: list[OrderEventRead] = []
    allowed_transitions: list[OrderStatus] = []
    viewer_role: str  # "customer" | "tailor" | "admin"
    can_review: bool = False
    my_review_rating: int | None = None
    conversation_id: uuid.UUID | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    note: str | None = Field(default=None, max_length=500)


class ReviewCreate(BaseModel):
    order_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class ConversationCreate(BaseModel):
    tailor_id: uuid.UUID


class ConversationRead(BaseModel):
    id: uuid.UUID
    other: UserBrief
    other_business_name: str | None = None
    request_id: uuid.UUID | None
    request_title: str | None
    last_message: str | None
    last_message_at: datetime | None
    unread: int


class MessageCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)

    @field_validator("body")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty")
        return v


class MessageRead(BaseModel):
    id: uuid.UUID
    sender_id: uuid.UUID
    body: str
    created_at: datetime
    is_mine: bool


class NotificationRead(BaseModel):
    id: uuid.UUID
    type: str
    data: dict
    link: str | None
    read_at: datetime | None
    created_at: datetime

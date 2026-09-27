import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, Field, PlainSerializer, field_validator

from app.core.constants import CITIES, SPECIALTIES
from app.core.storage import is_own_media_url
from app.models.enums import VerificationLevel
from app.schemas.catalog import ServiceRead
from app.schemas.common import Money

Rating = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


def _validate_city(v: str | None) -> str | None:
    if v is not None and v not in CITIES:
        raise ValueError(f"Unknown city; expected one of: {', '.join(CITIES)}")
    return v


class TailorBrief(BaseModel):
    id: uuid.UUID
    name: str
    business_name: str
    avatar_url: str | None
    city: str | None
    rating_avg: Rating
    rating_count: int
    verification_level: VerificationLevel


class TailorSummary(TailorBrief):
    specialties: list[str]
    years_experience: int | None
    offers_pickup: bool
    offers_delivery: bool
    price_from: Money | None
    bio: str | None


class TailorServiceRead(BaseModel):
    service: ServiceRead
    price_from: Money
    duration_days: int | None


class PortfolioRead(BaseModel):
    id: uuid.UUID
    image_url: str
    title: str
    description: str | None
    created_at: datetime


class TailorDetail(TailorSummary):
    services: list[TailorServiceRead]
    portfolio: list[PortfolioRead]
    member_since: datetime


class TailorProfileUpdate(BaseModel):
    business_name: str | None = Field(default=None, min_length=2, max_length=120)
    bio: str | None = Field(default=None, max_length=2000)
    city: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    specialties: list[str] | None = Field(default=None, max_length=12)
    years_experience: int | None = Field(default=None, ge=0, le=80)
    offers_pickup: bool | None = None
    offers_delivery: bool | None = None

    _city = field_validator("city")(_validate_city)

    @field_validator("specialties")
    @classmethod
    def _known_specialties(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        unknown = set(v) - set(SPECIALTIES)
        if unknown:
            raise ValueError(f"Unknown specialties: {', '.join(sorted(unknown))}")
        return list(dict.fromkeys(v))  # dedupe, keep order


class TailorServiceItem(BaseModel):
    service_id: int
    price_from: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    duration_days: int | None = Field(default=None, ge=1, le=90)


class TailorServicesReplace(BaseModel):
    items: list[TailorServiceItem] = Field(max_length=40)


class PortfolioCreate(BaseModel):
    image_url: str = Field(max_length=500)
    title: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)

    @field_validator("image_url")
    @classmethod
    def _own_media(cls, v: str) -> str:
        if not is_own_media_url(v):
            raise ValueError("Images must be uploaded through /media/images first")
        return v


class ReviewPublic(BaseModel):
    id: uuid.UUID
    rating: int
    comment: str | None
    author_name: str
    created_at: datetime


class Earnings(BaseModel):
    completed_orders: int
    active_orders: int
    total_earned: Money
    pending_payout: Money
    total_commission: Money

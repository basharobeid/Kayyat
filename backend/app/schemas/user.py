import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import Locale
from app.models.user import User


class UserRead(BaseModel):
    id: uuid.UUID
    email: str | None
    phone: str | None
    full_name: str
    locale: Locale
    avatar_url: str | None
    roles: list[str]
    email_verified: bool
    phone_verified: bool
    created_at: datetime

    @classmethod
    def from_user(cls, user: User) -> "UserRead":
        return cls(
            id=user.id,
            email=user.email,
            phone=user.phone,
            full_name=user.full_name,
            locale=user.locale,
            avatar_url=user.avatar_url,
            roles=user.role_names,
            email_verified=user.email_verified_at is not None,
            phone_verified=user.phone_verified_at is not None,
            created_at=user.created_at,
        )


class UserUpdate(BaseModel):
    """Email / phone changes need re-verification, so they get their own endpoints later."""

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    locale: Locale | None = None


class AddressBase(BaseModel):
    label: str = Field(min_length=1, max_length=60)
    line1: str = Field(min_length=1, max_length=200)
    line2: str | None = Field(default=None, max_length=200)
    district: str | None = Field(default=None, max_length=80)
    city: str = Field(min_length=1, max_length=80)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=60)
    line1: str | None = Field(default=None, min_length=1, max_length=200)
    line2: str | None = Field(default=None, max_length=200)
    district: str | None = Field(default=None, max_length=80)
    city: str | None = Field(default=None, min_length=1, max_length=80)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    is_default: bool | None = None


class AddressRead(AddressBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime

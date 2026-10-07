import re
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.models.enums import Locale

E164 = re.compile(r"^\+[1-9]\d{7,14}$")


def normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = re.sub(r"[\s\-()]", "", value)
    if not E164.match(cleaned):
        raise ValueError("Phone must be in international format, e.g. +966501234567")
    return cleaned


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = None
    password: str = Field(min_length=8, max_length=128)
    # Admins are never self-registered; seller/delivery onboarding arrives with phases 2–3.
    role: Literal["customer", "tailor"] = "customer"
    locale: Locale = Locale.AR

    _phone = field_validator("phone")(normalize_phone)

    @field_validator("email")
    @classmethod
    def _lower_email(cls, v: str | None) -> str | None:
        return v.lower() if v else v

    @model_validator(mode="after")
    def _email_or_phone(self) -> "RegisterRequest":
        if not self.email and not self.phone:
            raise ValueError("Provide an email or a phone number")
        return self


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=320, description="Email or phone")
    password: str = Field(min_length=1, max_length=128)


class GoogleLoginRequest(BaseModel):
    id_token: str = Field(min_length=20, max_length=4096)


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(description="Access token lifetime in seconds")

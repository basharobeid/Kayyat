from decimal import Decimal
from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_SECRET = "change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    app_name: str = "Khayyat API"
    environment: Literal["development", "test", "production"] = "development"

    # SQLite keeps local setup dependency-free; point this at Postgres
    # (postgresql+psycopg://...) for docker / production.
    database_url: str = "sqlite:///./khayyat.db"

    jwt_secret: str = INSECURE_SECRET
    jwt_algorithm: str = "HS256"
    jwt_access_expires_minutes: int = 15
    jwt_refresh_expires_days: int = 7

    # Comma-separated list of allowed browser origins.
    cors_origins: str = "http://localhost:3000"

    # Business rules live in config so they can change per market without code changes.
    platform_commission_rate: Decimal = Decimal("0.12")
    currency: str = "SYP"
    # Prices are stored in USD (stable) and shown in SYP at this rate. Set the live rate in env.
    usd_to_syp: int = 110
    # Comma-separated city slugs where bookings are accepted today (others show "coming soon").
    service_cities: str = "damascus"
    # Shown on shop-visit bookings; empty means "sent with your confirmation".
    shop_address: str = ""
    # How many bookings one time slot can take: vans for pickup/home/quick, chairs at the shop.
    van_capacity_per_slot: int = 2
    shop_capacity_per_slot: int = 3

    # Google Sign-In: the OAuth 2.0 Web client ID. Empty disables POST /auth/google.
    google_client_id: str = ""
    # Comma-separated emails that are granted the admin (staff) role when they sign in.
    admin_emails: str = ""

    # Local-disk media storage (swap for S3/R2 in app/core/storage.py).
    media_dir: str = "./media"
    media_base_url: str = "http://localhost:8000/media"
    max_upload_bytes: int = 5 * 1024 * 1024

    @field_validator("database_url")
    @classmethod
    def _use_psycopg_driver(cls, v: str) -> str:
        # Managed Postgres providers hand out plain postgres:// / postgresql:// URLs, which
        # make SQLAlchemy default to psycopg2 -- not installed here (we ship psycopg 3 via
        # the `postgres` extra). Normalize so any provider's URL works without manual editing.
        for prefix in ("postgres://", "postgresql://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    @property
    def service_city_list(self) -> list[str]:
        return [c.strip() for c in self.service_cities.split(",") if c.strip()]

    @property
    def admin_email_list(self) -> set[str]:
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")

    @model_validator(mode="after")
    def _refuse_insecure_production(self) -> "Settings":
        if self.environment == "production" and (
            self.jwt_secret == INSECURE_SECRET or len(self.jwt_secret.encode()) < 32
        ):
            raise ValueError("JWT_SECRET must be a random value of at least 32 bytes in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

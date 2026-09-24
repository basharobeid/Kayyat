from decimal import Decimal
from functools import lru_cache
from typing import Literal

from pydantic import model_validator
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

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, Timestamps, UUIDPrimaryKey


class Address(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "addresses"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    label: Mapped[str] = mapped_column(String(60), nullable=False)
    line1: Mapped[str] = mapped_column(String(200), nullable=False)
    line2: Mapped[str | None] = mapped_column(String(200))
    district: Mapped[str | None] = mapped_column(String(80))
    city: Mapped[str] = mapped_column(String(80), nullable=False)
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

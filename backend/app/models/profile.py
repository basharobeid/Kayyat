import uuid
from decimal import Decimal

from sqlalchemy import JSON, Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, Timestamps
from app.models.enums import VerificationLevel, str_enum
from app.models.user import User

# JSONB on Postgres (GIN-indexable for specialty filters), plain JSON elsewhere.
JSONList = JSON().with_variant(JSONB(), "postgresql")


class CustomerProfile(Timestamps, Base):
    __tablename__ = "customer_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    city: Mapped[str | None] = mapped_column(String(80))

    user: Mapped[User] = relationship()


class TailorProfile(Timestamps, Base):
    __tablename__ = "tailor_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    business_name: Mapped[str] = mapped_column(String(120), nullable=False)
    bio: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(80), index=True)
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    specialties: Mapped[list[str]] = mapped_column(JSONList, default=list, nullable=False)
    years_experience: Mapped[int | None] = mapped_column(Integer)
    offers_pickup: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    offers_delivery: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Denormalized from reviews for fast sorting; recomputed when a review is written.
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("0"), nullable=False)
    rating_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verification_level: Mapped[VerificationLevel] = mapped_column(
        str_enum(VerificationLevel), default=VerificationLevel.NONE, nullable=False
    )

    user: Mapped[User] = relationship(lazy="joined")

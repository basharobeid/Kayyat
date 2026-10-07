"""Direct bookings: the customer books one of four services and Khayyat fulfils it.

Times are stored as a local Damascus date plus a slot label ("10:00"), not as a timestamp:
a booking slot is a wall-clock promise to the customer, and keeping it as wall-clock data
avoids every timezone conversion between the API, the database and the browser.
"""

import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, Timestamps, UUIDPrimaryKey
from app.models.enums import BookingServiceType, PaymentStatus, str_enum
from app.models.user import User


class Booking(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "bookings"

    reference: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    service_type: Mapped[BookingServiceType] = mapped_column(
        str_enum(BookingServiceType), index=True, nullable=False
    )
    # Pipeline step. Plain string: each service type has its own pipeline (booking_service).
    status: Mapped[str] = mapped_column(String(32), index=True, nullable=False)

    description: Mapped[str] = mapped_column(Text, nullable=False)
    garment: Mapped[str | None] = mapped_column(String(40))
    quick_items: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    photo_urls: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)

    city: Mapped[str] = mapped_column(String(40), nullable=False)
    district: Mapped[str | None] = mapped_column(String(80))
    address_line: Mapped[str | None] = mapped_column(String(200))
    contact_phone: Mapped[str | None] = mapped_column(String(20))

    scheduled_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    slot: Mapped[str] = mapped_column(String(5), nullable=False)

    # Money in USD; the UI converts to SYP at settings.usd_to_syp.
    visit_fee_usd: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=0, nullable=False)
    estimate_min_usd: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    estimate_max_usd: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    final_price_usd: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    payment_status: Mapped[PaymentStatus] = mapped_column(
        str_enum(PaymentStatus), default=PaymentStatus.UNPAID, nullable=False
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Who is handling it, as shown to the customer ("Van 2 · Abu Ahmad").
    assignee_name: Mapped[str | None] = mapped_column(String(80))
    recommended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    rating: Mapped[int | None] = mapped_column(Integer)
    review_comment: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancel_reason: Mapped[str | None] = mapped_column(String(300))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    customer: Mapped[User] = relationship(lazy="joined")
    events: Mapped[list["BookingEvent"]] = relationship(
        back_populates="booking", order_by="BookingEvent.created_at", lazy="selectin",
        cascade="all, delete-orphan",
    )


class BookingEvent(UUIDPrimaryKey, Base):
    __tablename__ = "booking_events"

    booking_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bookings.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    booking: Mapped[Booking] = relationship(back_populates="events")


class SupportMessage(UUIDPrimaryKey, Base):
    """One support thread per customer; a message may be tied to a specific booking."""

    __tablename__ = "support_messages"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    booking_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), index=True
    )
    sender_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL")
    )
    from_staff: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

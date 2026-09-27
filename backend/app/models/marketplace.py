import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, Timestamps, UUIDPrimaryKey
from app.models.catalog import Service
from app.models.enums import OrderStatus, QuoteStatus, RequestStatus, str_enum
from app.models.user import User


class JobRequest(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "job_requests"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    service_id: Mapped[int | None] = mapped_column(ForeignKey("services.id", ondelete="SET NULL"))
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    address_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("addresses.id", ondelete="SET NULL")
    )
    preferred_date: Mapped[date | None] = mapped_column(Date)
    budget_max: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    needs_pickup: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    needs_delivery: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    photo_urls: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    status: Mapped[RequestStatus] = mapped_column(
        str_enum(RequestStatus), default=RequestStatus.OPEN, index=True, nullable=False
    )

    customer: Mapped[User] = relationship(lazy="joined")
    service: Mapped[Service | None] = relationship(lazy="joined")
    quotes: Mapped[list["Quote"]] = relationship(
        back_populates="request", order_by="Quote.created_at", lazy="selectin"
    )


class Quote(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "quotes"
    __table_args__ = (
        UniqueConstraint("request_id", "tailor_id"),
        CheckConstraint("price > 0", name="price_positive"),
        CheckConstraint("duration_days > 0", name="duration_positive"),
    )

    request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_requests.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tailor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    offers_pickup: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    offers_delivery: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    message: Mapped[str | None] = mapped_column(Text)
    status: Mapped[QuoteStatus] = mapped_column(
        str_enum(QuoteStatus), default=QuoteStatus.PENDING, nullable=False
    )

    request: Mapped[JobRequest] = relationship(back_populates="quotes")
    tailor: Mapped[User] = relationship(lazy="joined")


class Order(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "orders"

    reference: Mapped[str] = mapped_column(String(16), unique=True, nullable=False)
    request_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_requests.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    quote_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quotes.id", ondelete="RESTRICT"), unique=True, nullable=False
    )
    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    tailor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)

    # Money is frozen at acceptance so later rate changes never rewrite history.
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    commission_rate: Mapped[Decimal] = mapped_column(Numeric(5, 4), nullable=False)
    commission_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    tailor_payout: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(20), default="cash", nullable=False)

    pickup: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    delivery: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        str_enum(OrderStatus), default=OrderStatus.CONFIRMED, index=True, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    request: Mapped[JobRequest] = relationship(lazy="joined")
    customer: Mapped[User] = relationship(foreign_keys=[customer_id], lazy="joined")
    tailor: Mapped[User] = relationship(foreign_keys=[tailor_id], lazy="joined")
    events: Mapped[list["OrderEvent"]] = relationship(
        back_populates="order", order_by="OrderEvent.created_at", lazy="selectin"
    )


class OrderEvent(UUIDPrimaryKey, Base):
    """order_timeline in the blueprint: one row per status change."""

    __tablename__ = "order_events"

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(str_enum(OrderStatus), nullable=False)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    note: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    order: Mapped[Order] = relationship(back_populates="events")


class Review(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("order_id", "author_id"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="rating_range"),
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    target_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    author: Mapped[User] = relationship(foreign_keys=[author_id], lazy="joined")


class Conversation(UUIDPrimaryKey, Timestamps, Base):
    """A thread between one customer and one tailor, optionally about a request."""

    __tablename__ = "conversations"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    tailor_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    request_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("job_requests.id", ondelete="SET NULL"), index=True
    )
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    customer_last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    tailor_last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    customer: Mapped[User] = relationship(foreign_keys=[customer_id], lazy="joined")
    tailor: Mapped[User] = relationship(foreign_keys=[tailor_id], lazy="joined")
    request: Mapped[JobRequest | None] = relationship(lazy="joined")


class Message(UUIDPrimaryKey, Base):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )


class Notification(UUIDPrimaryKey, Base):
    """In-app notification. The frontend renders localized text from `type` + `data`."""

    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    data: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    link: Mapped[str | None] = mapped_column(String(200))
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

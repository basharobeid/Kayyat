"""Request -> quote -> order -> review lifecycle."""

import secrets
import uuid
from datetime import UTC, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import Conflict, Forbidden, NotFound, ProblemError
from app.models import (
    Address,
    Conversation,
    JobRequest,
    Order,
    OrderEvent,
    OrderStatus,
    Quote,
    QuoteStatus,
    RequestStatus,
    Review,
    RoleName,
    Service,
    TailorProfile,
    User,
)
from app.schemas.marketplace import QuoteCreate, RequestCreate, ReviewCreate
from app.services.notification_service import notify

OPEN_STATES = (RequestStatus.OPEN, RequestStatus.QUOTES_RECEIVED)
FINAL_ORDER_STATES = (OrderStatus.COMPLETED, OrderStatus.CANCELLED)

CUSTOMER, TAILOR = "customer", "tailor"

# Who may move an order from one status to the next. Admins may make any listed move
# and may also cancel any unfinished order.
TRANSITIONS: dict[OrderStatus, dict[OrderStatus, set[str]]] = {
    OrderStatus.CONFIRMED: {
        OrderStatus.PICKED_UP: {TAILOR},
        OrderStatus.IN_PROGRESS: {TAILOR},
        OrderStatus.CANCELLED: {TAILOR, CUSTOMER},
    },
    OrderStatus.PICKED_UP: {OrderStatus.IN_PROGRESS: {TAILOR}},
    OrderStatus.IN_PROGRESS: {OrderStatus.READY: {TAILOR}},
    OrderStatus.READY: {OrderStatus.OUT_FOR_DELIVERY: {TAILOR}, OrderStatus.DELIVERED: {TAILOR}},
    OrderStatus.OUT_FOR_DELIVERY: {OrderStatus.DELIVERED: {TAILOR}},
    OrderStatus.DELIVERED: {OrderStatus.COMPLETED: {CUSTOMER}},
}


class InvalidState(ProblemError):
    def __init__(self, detail: str):
        super().__init__(409, "Invalid State", detail, type_="invalid-state")


def _now() -> datetime:
    return datetime.now(UTC)


# --- Requests ------------------------------------------------------------------------------


def create_request(db: Session, customer: User, data: RequestCreate) -> JobRequest:
    if data.service_id is not None:
        service = db.get(Service, data.service_id)
        if service is None or not service.is_active:
            raise NotFound("Service not found")
    if data.address_id is not None:
        address = db.get(Address, data.address_id)
        if address is None or address.user_id != customer.id:
            raise NotFound("Address not found")

    request = JobRequest(customer_id=customer.id, **data.model_dump())
    db.add(request)
    db.commit()
    return request


def get_request(db: Session, request_id: uuid.UUID) -> JobRequest:
    request = db.get(JobRequest, request_id)
    if request is None:
        raise NotFound("Request not found")
    return request


def can_view_request(user: User, request: JobRequest) -> bool:
    if request.customer_id == user.id or user.has_role(RoleName.ADMIN):
        return True
    if user.has_role(RoleName.TAILOR):
        return request.status in OPEN_STATES or any(q.tailor_id == user.id for q in request.quotes)
    return False


def cancel_request(db: Session, user: User, request: JobRequest) -> JobRequest:
    if request.customer_id != user.id:
        raise Forbidden()
    if request.status not in OPEN_STATES:
        raise InvalidState("Only open requests can be cancelled; cancel the order instead")
    request.status = RequestStatus.CANCELLED
    for quote in request.quotes:
        if quote.status == QuoteStatus.PENDING:
            quote.status = QuoteStatus.REJECTED
            notify(db, quote.tailor_id, "request_cancelled", {"title": request.title})
    db.commit()
    return request


# --- Conversations -------------------------------------------------------------------------


def get_or_create_conversation(
    db: Session, customer_id: uuid.UUID, tailor_id: uuid.UUID, request_id: uuid.UUID | None
) -> Conversation:
    stmt = select(Conversation).where(
        Conversation.customer_id == customer_id, Conversation.tailor_id == tailor_id
    )
    stmt = stmt.where(
        Conversation.request_id == request_id
        if request_id
        else Conversation.request_id.is_(None)
    )
    conversation = db.scalar(stmt)
    if conversation is None:
        conversation = Conversation(
            customer_id=customer_id, tailor_id=tailor_id, request_id=request_id
        )
        db.add(conversation)
        db.flush()
    return conversation


# --- Quotes --------------------------------------------------------------------------------


def submit_quote(db: Session, tailor: User, request: JobRequest, data: QuoteCreate) -> Quote:
    if request.customer_id == tailor.id:
        raise Forbidden("You cannot quote on your own request")
    if request.status not in OPEN_STATES:
        raise InvalidState("This request is no longer accepting quotes")

    quote = db.scalar(
        select(Quote).where(Quote.request_id == request.id, Quote.tailor_id == tailor.id)
    )
    if quote is not None and quote.status not in (QuoteStatus.PENDING, QuoteStatus.WITHDRAWN):
        raise InvalidState("Your quote on this request can no longer be changed")

    is_new = quote is None or quote.status == QuoteStatus.WITHDRAWN
    if quote is None:
        quote = Quote(request_id=request.id, tailor_id=tailor.id, **data.model_dump())
        db.add(quote)
    else:
        for field, value in data.model_dump().items():
            setattr(quote, field, value)
        quote.status = QuoteStatus.PENDING

    request.status = RequestStatus.QUOTES_RECEIVED
    get_or_create_conversation(db, request.customer_id, tailor.id, request.id)
    if is_new:
        notify(
            db, request.customer_id, "quote_received",
            {"title": request.title, "tailor": tailor.full_name},
            f"/requests/{request.id}",
        )
    db.commit()
    return quote


def withdraw_quote(db: Session, tailor: User, quote: Quote) -> Quote:
    if quote.tailor_id != tailor.id:
        raise NotFound("Quote not found")
    if quote.status != QuoteStatus.PENDING:
        raise InvalidState("Only pending quotes can be withdrawn")
    quote.status = QuoteStatus.WITHDRAWN

    request = quote.request
    if not any(q.status == QuoteStatus.PENDING for q in request.quotes if q.id != quote.id):
        request.status = RequestStatus.OPEN
    db.commit()
    return quote


def _new_reference() -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O, 1/I lookalikes
    return "KH-" + "".join(secrets.choice(alphabet) for _ in range(7))


def accept_quote(db: Session, customer: User, quote: Quote) -> Order:
    request = quote.request
    if request.customer_id != customer.id:
        raise NotFound("Quote not found")
    if request.status not in OPEN_STATES or quote.status != QuoteStatus.PENDING:
        raise InvalidState("This quote can no longer be accepted")

    rate = settings.platform_commission_rate
    commission = (quote.price * rate).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    order = Order(
        reference=_new_reference(),
        request_id=request.id,
        quote_id=quote.id,
        customer_id=customer.id,
        tailor_id=quote.tailor_id,
        title=request.title,
        price=quote.price,
        commission_rate=rate,
        commission_amount=commission,
        tailor_payout=quote.price - commission,
        pickup=request.needs_pickup and quote.offers_pickup,
        delivery=request.needs_delivery and quote.offers_delivery,
        due_date=(_now() + timedelta(days=quote.duration_days)).date(),
        status=OrderStatus.CONFIRMED,
    )
    order.events.append(OrderEvent(status=OrderStatus.CONFIRMED, actor_id=customer.id,
                                   created_at=_now()))
    db.add(order)

    quote.status = QuoteStatus.ACCEPTED
    request.status = RequestStatus.TAILOR_SELECTED
    for other in request.quotes:
        if other.id != quote.id and other.status == QuoteStatus.PENDING:
            other.status = QuoteStatus.REJECTED
            notify(db, other.tailor_id, "quote_rejected", {"title": request.title})

    notify(db, quote.tailor_id, "quote_accepted",
           {"title": request.title, "reference": order.reference}, f"/orders/{order.id}")
    db.commit()
    return order


# --- Orders --------------------------------------------------------------------------------


def viewer_role(user: User, order: Order) -> str | None:
    if order.customer_id == user.id:
        return CUSTOMER
    if order.tailor_id == user.id:
        return TAILOR
    if user.has_role(RoleName.ADMIN):
        return "admin"
    return None


def get_order_for(db: Session, user: User, order_id: uuid.UUID) -> tuple[Order, str]:
    order = db.get(Order, order_id)
    role = viewer_role(user, order) if order else None
    if order is None or role is None:
        raise NotFound("Order not found")
    return order, role


def allowed_transitions(order: Order, role: str) -> list[OrderStatus]:
    moves = TRANSITIONS.get(order.status, {})
    allowed = [
        target for target, roles in moves.items()
        if role in roles or role == "admin"
    ]
    if role == "admin" and order.status not in FINAL_ORDER_STATES and \
            OrderStatus.CANCELLED not in allowed:
        allowed.append(OrderStatus.CANCELLED)
    # Only offer logistics steps the order actually uses.
    if not order.pickup:
        allowed = [s for s in allowed if s != OrderStatus.PICKED_UP]
    if not order.delivery:
        allowed = [s for s in allowed if s != OrderStatus.OUT_FOR_DELIVERY]
    return allowed


_REQUEST_STATUS_FOR = {
    OrderStatus.IN_PROGRESS: RequestStatus.IN_PROGRESS,
    OrderStatus.COMPLETED: RequestStatus.COMPLETED,
    OrderStatus.CANCELLED: RequestStatus.CANCELLED,
}


def change_order_status(
    db: Session, user: User, order: Order, role: str, target: OrderStatus, note: str | None
) -> Order:
    if target not in allowed_transitions(order, role):
        raise InvalidState(f"Cannot move this order from {order.status.value} to {target.value}")

    order.status = target
    if target == OrderStatus.COMPLETED:
        order.completed_at = _now()
    if target in _REQUEST_STATUS_FOR:
        order.request.status = _REQUEST_STATUS_FOR[target]
    # Append via the relationship so the already-loaded timeline includes this event.
    order.events.append(OrderEvent(status=target, actor_id=user.id, note=note,
                                   created_at=_now()))

    other = order.tailor_id if user.id == order.customer_id else order.customer_id
    recipients = {order.customer_id, order.tailor_id} if role == "admin" else {other}
    for recipient in recipients:
        notify(db, recipient, "order_status",
               {"reference": order.reference, "status": target.value}, f"/orders/{order.id}")
    db.commit()
    return order


# --- Reviews -------------------------------------------------------------------------------


def recompute_rating(db: Session, user_id: uuid.UUID) -> None:
    profile = db.get(TailorProfile, user_id)
    if profile is None:
        return
    avg, count = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.target_user_id == user_id, Review.is_hidden.is_(False)
        )
    ).one()
    profile.rating_count = count
    profile.rating_avg = Decimal(str(avg or 0)).quantize(Decimal("0.01"))


def create_review(db: Session, author: User, data: ReviewCreate) -> Review:
    order, role = get_order_for(db, author, data.order_id)
    if role not in (CUSTOMER, TAILOR):
        raise Forbidden("Only the customer or tailor on this order can review it")
    if order.status != OrderStatus.COMPLETED:
        raise InvalidState("Reviews open once the order is completed")
    if db.scalar(select(Review.id).where(Review.order_id == order.id,
                                         Review.author_id == author.id)):
        raise Conflict("You have already reviewed this order")

    target = order.tailor_id if role == CUSTOMER else order.customer_id
    review = Review(order_id=order.id, author_id=author.id, target_user_id=target,
                    rating=data.rating, comment=data.comment)
    db.add(review)
    db.flush()
    recompute_rating(db, target)
    notify(db, target, "review_received", {"rating": data.rating, "reference": order.reference},
           f"/orders/{order.id}")
    db.commit()
    return review

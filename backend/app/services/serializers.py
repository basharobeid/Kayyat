"""Model -> schema conversion that needs more than one row (and shouldn't N+1)."""

import uuid
from collections.abc import Iterable
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Address,
    Conversation,
    JobRequest,
    Order,
    OrderStatus,
    Quote,
    QuoteStatus,
    Review,
    RoleName,
    TailorProfile,
    User,
)
from app.models.enums import VerificationLevel
from app.schemas.catalog import ServiceRead
from app.schemas.common import UserBrief, first_name
from app.schemas.marketplace import OrderEventRead, OrderRead, QuoteRead, RequestRead
from app.schemas.tailor import TailorBrief
from app.schemas.user import AddressRead
from app.services.marketplace_service import allowed_transitions


def user_brief(user: User, *, full_name: bool = True) -> UserBrief:
    return UserBrief(
        id=user.id,
        name=user.full_name if full_name else first_name(user.full_name),
        avatar_url=user.avatar_url,
    )


def _brief(user: User, profile: TailorProfile | None) -> TailorBrief:
    return TailorBrief(
        id=user.id,
        name=user.full_name,
        business_name=profile.business_name if profile else user.full_name,
        avatar_url=user.avatar_url,
        city=profile.city if profile else None,
        rating_avg=profile.rating_avg if profile else Decimal("0"),
        rating_count=profile.rating_count if profile else 0,
        verification_level=profile.verification_level if profile else VerificationLevel.NONE,
    )


def tailor_briefs(db: Session, users: Iterable[User]) -> dict[uuid.UUID, TailorBrief]:
    users = {u.id: u for u in users}
    if not users:
        return {}
    profiles = {
        p.user_id: p
        for p in db.scalars(select(TailorProfile).where(TailorProfile.user_id.in_(users)))
    }
    return {uid: _brief(u, profiles.get(uid)) for uid, u in users.items()}


def tailor_brief(db: Session, user: User) -> TailorBrief:
    return tailor_briefs(db, [user])[user.id]


# --- Marketplace read models ----------------------------------------------------------------


def _conversation_ids(db: Session, request_id: uuid.UUID) -> dict[uuid.UUID, uuid.UUID]:
    """tailor_id -> conversation_id for one request."""
    rows = db.execute(
        select(Conversation.tailor_id, Conversation.id).where(
            Conversation.request_id == request_id
        )
    )
    return dict(rows.tuples().all())


def quote_reads(db: Session, quotes: list[Quote]) -> list[QuoteRead]:
    if not quotes:
        return []
    briefs = tailor_briefs(db, [q.tailor for q in quotes])
    conversations: dict[uuid.UUID, dict[uuid.UUID, uuid.UUID]] = {}
    out = []
    for q in quotes:
        if q.request_id not in conversations:
            conversations[q.request_id] = _conversation_ids(db, q.request_id)
        out.append(QuoteRead(
            id=q.id, request_id=q.request_id, tailor=briefs[q.tailor_id], price=q.price,
            duration_days=q.duration_days, offers_pickup=q.offers_pickup,
            offers_delivery=q.offers_delivery, message=q.message, status=q.status,
            created_at=q.created_at,
            conversation_id=conversations[q.request_id].get(q.tailor_id),
            request_title=q.request.title, request_status=q.request.status,
        ))
    return out


def request_read(db: Session, request: JobRequest, viewer: User) -> RequestRead:
    is_owner = request.customer_id == viewer.id
    is_admin = viewer.has_role(RoleName.ADMIN)
    live_quotes = [q for q in request.quotes if q.status != QuoteStatus.WITHDRAWN]
    order_id = db.scalar(select(Order.id).where(Order.request_id == request.id))

    quotes = my_quote = None
    if is_owner or is_admin:
        quotes = quote_reads(db, live_quotes)
    else:
        mine = [q for q in request.quotes if q.tailor_id == viewer.id]
        my_quote = quote_reads(db, mine)[0] if mine else None

    return RequestRead(
        id=request.id, title=request.title, description=request.description,
        city=request.city,
        service=ServiceRead.of(request.service) if request.service else None,
        preferred_date=request.preferred_date, budget_max=request.budget_max,
        needs_pickup=request.needs_pickup, needs_delivery=request.needs_delivery,
        photo_urls=request.photo_urls, status=request.status, created_at=request.created_at,
        customer=user_brief(request.customer, full_name=is_owner or is_admin),
        quote_count=len(live_quotes), quotes=quotes, my_quote=my_quote,
        order_id=order_id if (is_owner or is_admin or (my_quote and order_id)) else None,
        is_owner=is_owner,
    )


def order_read(db: Session, order: Order, role: str, *, detail: bool = True) -> OrderRead:
    sees_money = role in ("tailor", "admin")
    address = None
    my_review = None
    conversation_id = None
    if detail:
        if order.request.address_id:
            addr = db.get(Address, order.request.address_id)
            address = AddressRead.model_validate(addr) if addr else None
        if role in ("customer", "tailor"):
            viewer_id = order.customer_id if role == "customer" else order.tailor_id
            my_review = db.scalar(select(Review.rating).where(
                Review.order_id == order.id, Review.author_id == viewer_id))
        conversation_id = db.scalar(select(Conversation.id).where(
            Conversation.request_id == order.request_id,
            Conversation.tailor_id == order.tailor_id))

    return OrderRead(
        id=order.id, reference=order.reference, title=order.title, request_id=order.request_id,
        price=order.price,
        commission_amount=order.commission_amount if sees_money else None,
        tailor_payout=order.tailor_payout if sees_money else None,
        payment_method=order.payment_method, pickup=order.pickup, delivery=order.delivery,
        due_date=order.due_date, status=order.status, created_at=order.created_at,
        completed_at=order.completed_at,
        customer=user_brief(order.customer),
        tailor=tailor_brief(db, order.tailor),
        address=address,
        events=[OrderEventRead(status=e.status, note=e.note, created_at=e.created_at)
                for e in order.events] if detail else [],
        allowed_transitions=allowed_transitions(order, role) if detail else [],
        viewer_role=role,
        can_review=(detail and role in ("customer", "tailor")
                    and order.status == OrderStatus.COMPLETED and my_review is None),
        my_review_rating=my_review,
        conversation_id=conversation_id,
    )

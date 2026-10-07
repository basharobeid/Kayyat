import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select

from app.api.deps import CurrentUser, DbSession, require_roles
from app.core.config import settings
from app.core.database import utcnow
from app.core.exceptions import NotFound
from app.models import Booking, SupportMessage, User
from app.models.enums import BookingServiceType, RoleName
from app.schemas.booking import (
    BookingCreate,
    BookingOptions,
    BookingRead,
    CancelRequest,
    PipelineStep,
    PriceUpdate,
    Recommendation,
    RecommendRequest,
    ReviewCreate,
    SlotRead,
    StaffAdvance,
    SupportMessageCreate,
    SupportMessageRead,
    SupportThread,
)
from app.schemas.common import Page, PageParams, paginate
from app.services import booking_service as svc
from app.services.notification_service import notify

router = APIRouter(tags=["bookings"])
StaffUser = Annotated[User, Depends(require_roles(RoleName.ADMIN))]


def _read(b: Booking, *, staff: bool = False) -> BookingRead:
    pipeline = svc.PIPELINES[b.service_type]
    reached = {e.status: e.created_at for e in b.events}
    steps = [PipelineStep(status=s, reached_at=reached.get(s), current=(s == b.status))
             for s in pipeline]
    return BookingRead(
        id=b.id, reference=b.reference, service_type=b.service_type, status=b.status,
        description=b.description, garment=b.garment, quick_items=b.quick_items,
        photo_urls=b.photo_urls, city=b.city, district=b.district, address_line=b.address_line,
        contact_phone=b.contact_phone, scheduled_date=b.scheduled_date, slot=b.slot,
        visit_fee_usd=b.visit_fee_usd, estimate_min_usd=b.estimate_min_usd,
        estimate_max_usd=b.estimate_max_usd, final_price_usd=b.final_price_usd,
        payment_status=b.payment_status, paid_at=b.paid_at, assignee_name=b.assignee_name,
        rating=b.rating, review_comment=b.review_comment, cancel_reason=b.cancel_reason,
        created_at=b.created_at, completed_at=b.completed_at, pipeline=steps,
        events=[{"status": e.status, "note": e.note, "created_at": e.created_at}
                for e in b.events],
        next_status=svc.next_status(b) if b.status != svc.CANCELLED else None,
        can_cancel=b.status in svc.CUSTOMER_CANCELLABLE,
        can_review=b.status == "completed" and b.rating is None,
        customer_name=b.customer.full_name if staff else None,
        shop_address=(settings.shop_address or None)
        if b.service_type == BookingServiceType.SHOP_VISIT else None,
    )


# --- Public: options, recommendation, availability -------------------------------------


@router.get("/bookings/options", response_model=BookingOptions)
def options() -> BookingOptions:
    return BookingOptions(
        usd_to_syp=settings.usd_to_syp,
        service_cities=settings.service_city_list,
        shop_address=settings.shop_address or None,
        visit_fees_usd={t.value: fee for t, fee in svc.VISIT_FEE_USD.items()},
        quick_items_usd={k: [lo, hi] for k, (lo, hi) in svc.QUICK_ITEMS_USD.items()},
        slots={t.value: svc.slots_for(t) for t in BookingServiceType},
        closed_weekday=svc.CLOSED_WEEKDAY,
        horizon_days=svc.BOOKING_HORIZON_DAYS,
        google_client_id=settings.google_client_id or None,
    )


@router.post("/bookings/recommend", response_model=Recommendation)
def recommend(data: RecommendRequest) -> Recommendation:
    return Recommendation(**svc.recommend(data.description, data.quick_items, data.prefers_home))


@router.get("/bookings/availability", response_model=list[SlotRead])
def availability(
    db: DbSession, service_type: BookingServiceType, day: Annotated[date, Query(alias="date")]
) -> list[SlotRead]:
    return [SlotRead(**s) for s in svc.availability(db, service_type, day)]


# --- Customer ---------------------------------------------------------------------------


@router.post("/bookings", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create(data: BookingCreate, user: CurrentUser, db: DbSession) -> BookingRead:
    return _read(svc.create_booking(db, user, data))


@router.get("/bookings", response_model=list[BookingRead])
def my_bookings(user: CurrentUser, db: DbSession) -> list[BookingRead]:
    rows = db.scalars(
        select(Booking).where(Booking.customer_id == user.id)
        .order_by(Booking.scheduled_date.desc(), Booking.slot.desc(), Booking.id.desc())
        .limit(100)
    )
    return [_read(b) for b in rows]


@router.get("/bookings/{booking_id}", response_model=BookingRead)
def get_booking(booking_id: uuid.UUID, user: CurrentUser, db: DbSession) -> BookingRead:
    if user.has_role(RoleName.ADMIN):
        return _read(svc.get_any(db, booking_id), staff=True)
    return _read(svc.get_for_customer(db, user, booking_id))


@router.post("/bookings/{booking_id}/cancel", response_model=BookingRead)
def cancel(booking_id: uuid.UUID, data: CancelRequest, user: CurrentUser,
           db: DbSession) -> BookingRead:
    booking = svc.get_for_customer(db, user, booking_id)
    return _read(svc.cancel(db, booking, by_staff=False, reason=data.reason))


@router.post("/bookings/{booking_id}/review", response_model=BookingRead)
def review(booking_id: uuid.UUID, data: ReviewCreate, user: CurrentUser,
           db: DbSession) -> BookingRead:
    booking = svc.get_for_customer(db, user, booking_id)
    return _read(svc.review(db, user, booking, data.rating, data.comment))


# --- Staff ------------------------------------------------------------------------------


@router.get("/staff/bookings", response_model=Page[BookingRead])
def staff_bookings(
    _: StaffUser, db: DbSession, params: Annotated[PageParams, Depends()],
    status_: Annotated[str | None, Query(alias="status")] = None,
    active: bool = False,
) -> Page[BookingRead]:
    stmt = select(Booking)
    if status_:
        stmt = stmt.where(Booking.status == status_)
    if active:
        stmt = stmt.where(Booking.status.notin_(["completed", svc.CANCELLED]))
    stmt = stmt.order_by(Booking.scheduled_date, Booking.slot, Booking.id)
    rows, meta = paginate(db, stmt, params)
    return Page[BookingRead](items=[_read(b, staff=True) for b in rows], **meta)


@router.post("/staff/bookings/{booking_id}/advance", response_model=BookingRead)
def staff_advance(booking_id: uuid.UUID, data: StaffAdvance, _: StaffUser,
                  db: DbSession) -> BookingRead:
    booking = svc.get_any(db, booking_id)
    return _read(svc.advance(db, booking, data.note, data.assignee_name), staff=True)


@router.post("/staff/bookings/{booking_id}/cancel", response_model=BookingRead)
def staff_cancel(booking_id: uuid.UUID, data: CancelRequest, _: StaffUser,
                 db: DbSession) -> BookingRead:
    booking = svc.get_any(db, booking_id)
    return _read(svc.cancel(db, booking, by_staff=True, reason=data.reason), staff=True)


@router.post("/staff/bookings/{booking_id}/price", response_model=BookingRead)
def staff_price(booking_id: uuid.UUID, data: PriceUpdate, _: StaffUser,
                db: DbSession) -> BookingRead:
    booking = svc.get_any(db, booking_id)
    return _read(svc.set_price(db, booking, data.final_price_usd), staff=True)


@router.post("/staff/bookings/{booking_id}/paid", response_model=BookingRead)
def staff_paid(booking_id: uuid.UUID, _: StaffUser, db: DbSession) -> BookingRead:
    booking = svc.get_any(db, booking_id)
    return _read(svc.mark_paid(db, booking), staff=True)


# --- Support chat -----------------------------------------------------------------------


def _messages(db: DbSession, customer_id: uuid.UUID) -> list[SupportMessageRead]:
    rows = db.scalars(
        select(SupportMessage).where(SupportMessage.customer_id == customer_id)
        .order_by(SupportMessage.created_at.desc(), SupportMessage.id.desc()).limit(200)
    )
    return [SupportMessageRead(id=m.id, body=m.body, photo_url=m.photo_url,
                               booking_id=m.booking_id, from_staff=m.from_staff,
                               created_at=m.created_at) for m in reversed(list(rows))]


def _add_message(db: DbSession, customer_id: uuid.UUID, sender: User, from_staff: bool,
                 data: SupportMessageCreate) -> SupportMessage:
    if data.booking_id is not None:
        booking = db.get(Booking, data.booking_id)
        if booking is None or booking.customer_id != customer_id:
            raise NotFound("Booking not found")
    if data.photo_url and not svc.is_own_media_url(data.photo_url):
        raise svc._invalid("Photos must be uploaded through /media/images first")
    msg = SupportMessage(customer_id=customer_id, booking_id=data.booking_id,
                         sender_id=sender.id, from_staff=from_staff, body=data.body,
                         photo_url=data.photo_url, created_at=utcnow())
    db.add(msg)
    return msg


@router.get("/support/messages", response_model=list[SupportMessageRead])
def my_messages(user: CurrentUser, db: DbSession) -> list[SupportMessageRead]:
    return _messages(db, user.id)


@router.post("/support/messages", response_model=SupportMessageRead,
             status_code=status.HTTP_201_CREATED)
def send_message(data: SupportMessageCreate, user: CurrentUser,
                 db: DbSession) -> SupportMessageRead:
    msg = _add_message(db, user.id, user, False, data)
    db.commit()
    return SupportMessageRead(id=msg.id, body=msg.body, photo_url=msg.photo_url,
                              booking_id=msg.booking_id, from_staff=False,
                              created_at=msg.created_at)


@router.get("/staff/support", response_model=list[SupportThread])
def staff_threads(_: StaffUser, db: DbSession) -> list[SupportThread]:
    latest = (select(SupportMessage.customer_id, func.max(SupportMessage.created_at).label("at"))
              .group_by(SupportMessage.customer_id).subquery())
    rows = db.execute(
        select(SupportMessage, User.full_name)
        .join(latest, (SupportMessage.customer_id == latest.c.customer_id)
              & (SupportMessage.created_at == latest.c.at))
        .join(User, User.id == SupportMessage.customer_id)
        .order_by(SupportMessage.created_at.desc())
    ).all()
    seen, threads = set(), []
    for msg, name in rows:
        if msg.customer_id in seen:
            continue
        seen.add(msg.customer_id)
        threads.append(SupportThread(customer_id=msg.customer_id, customer_name=name,
                                     last_message=msg.body, last_at=msg.created_at,
                                     last_from_staff=msg.from_staff))
    return threads


@router.get("/staff/support/{customer_id}", response_model=list[SupportMessageRead])
def staff_thread(customer_id: uuid.UUID, _: StaffUser, db: DbSession) -> list[SupportMessageRead]:
    return _messages(db, customer_id)


@router.post("/staff/support/{customer_id}", response_model=SupportMessageRead,
             status_code=status.HTTP_201_CREATED)
def staff_reply(customer_id: uuid.UUID, data: SupportMessageCreate, staff: StaffUser,
                db: DbSession) -> SupportMessageRead:
    if db.get(User, customer_id) is None:
        raise NotFound("Customer not found")
    msg = _add_message(db, customer_id, staff, True, data)
    link = f"/bookings/{data.booking_id}" if data.booking_id else "/account"
    notify(db, customer_id, "support_reply", {"preview": data.body[:80]}, link=link)
    db.commit()
    return SupportMessageRead(id=msg.id, body=msg.body, photo_url=msg.photo_url,
                              booking_id=msg.booking_id, from_staff=True,
                              created_at=msg.created_at)

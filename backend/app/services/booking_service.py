"""Bookings: pipelines, pricing, availability, recommendation and status changes."""

import re
import secrets
import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import utcnow
from app.core.exceptions import Conflict, Forbidden, NotFound, ProblemError
from app.core.storage import is_own_media_url
from app.models import Booking, BookingEvent, User
from app.models.enums import BookingServiceType as T
from app.models.enums import PaymentStatus
from app.services.notification_service import notify

# Syria has stayed on UTC+3 year-round since 2022, so a fixed offset is exact and avoids
# depending on the OS timezone database (absent on Windows without the tzdata package).
DAMASCUS = timezone(timedelta(hours=3))
CLOSED_WEEKDAY = 4  # Friday
BOOKING_HORIZON_DAYS = 14

# --- Pipelines: the tracking timeline the customer sees, in order -----------------------

PIPELINES: dict[T, list[str]] = {
    T.VAN_PICKUP: [
        "submitted", "confirmed", "van_assigned", "pickup_in_progress", "item_received",
        "in_progress", "quality_check", "ready", "completed",
    ],
    T.HOME_SERVICE: [
        "submitted", "confirmed", "tailor_assigned", "on_the_way", "at_location",
        "in_progress", "completed",
    ],
    T.SHOP_VISIT: ["submitted", "confirmed", "visited", "in_progress", "ready", "completed"],
    T.QUICK_FIX: [
        "submitted", "confirmed", "pickup_in_progress", "item_received", "in_progress",
        "ready", "completed",
    ],
}
CANCELLED = "cancelled"
CUSTOMER_CANCELLABLE = {"submitted", "confirmed"}
NEEDS_ADDRESS = {T.VAN_PICKUP, T.HOME_SERVICE, T.QUICK_FIX}
VAN_TYPES = {T.VAN_PICKUP, T.HOME_SERVICE, T.QUICK_FIX}

# --- Prices (USD). Business defaults; final work price is confirmed after inspection. ---

VISIT_FEE_USD: dict[T, Decimal] = {
    T.SHOP_VISIT: Decimal("0"),
    T.VAN_PICKUP: Decimal("2"),
    T.HOME_SERVICE: Decimal("5"),
    T.QUICK_FIX: Decimal("1"),
}
QUICK_ITEMS_USD: dict[str, tuple[Decimal, Decimal]] = {
    "button": (Decimal("1"), Decimal("2")),
    "stitching": (Decimal("2"), Decimal("4")),
    "tear": (Decimal("3"), Decimal("6")),
    "zipper": (Decimal("4"), Decimal("8")),
    "adjustment": (Decimal("3"), Decimal("6")),
    "other": (Decimal("2"), Decimal("6")),
}

VAN_SLOTS = ["10:00", "12:00", "14:00", "16:00", "18:00"]  # two-hour arrival windows
SHOP_SLOTS = [f"{h:02d}:00" for h in range(10, 20)]


def slots_for(service_type: T) -> list[str]:
    return SHOP_SLOTS if service_type == T.SHOP_VISIT else VAN_SLOTS


def now_damascus() -> datetime:
    return datetime.now(DAMASCUS)


# --- Recommendation ---------------------------------------------------------------------

_TASHKEEL = re.compile(r"[ً-ْـ]")

_QUICK_WORDS = [
    "زر", "ازرار", "أزرار", "كبسه", "كبسة", "سحاب", "سحّاب", "شق", "تمزق", "مقطوع", "ثقب",
    "درزه", "درزة", "فاتق", "button", "zip", "zipper", "tear", "rip", "hole", "stitch",
    "seam", "loose thread",
]
_MEASURE_WORDS = [
    "تضييق", "ضيق", "توسيع", "وسع", "تقصير", "قصر", "تطويل", "مقاس", "قياس", "اكمام", "أكمام",
    "خصر", "take in", "let out", "shorten", "hem", "taper", "resize", "fit", "sleeve", "waist",
    "length",
]
_CUSTOM_WORDS = [
    "تفصيل", "جديد", "بدله", "بدلة", "فستان عرس", "فستان زفاف", "عرس", "زفاف", "سهره", "سهرة",
    "custom", "made to measure", "bespoke", "new suit", "wedding", "evening gown",
]
# Jobs a tailor can usually finish on site in under an hour.
_ON_SITE_WORDS = ["تقصير", "قصر", "اكمام", "أكمام", "shorten", "hem", "sleeve"]


_AR_PREFIXES = ("", "ال", "و", "وال", "ب", "بال", "لل")
_TOKEN = re.compile(r"[\w؀-ۿ]+")


def _norm(text: str) -> str:
    return _TASHKEEL.sub("", text).lower()


def _has(text: str, words: list[str]) -> bool:
    """Whole-word match, so "زر" (button) doesn't fire inside "أزرق" (blue)."""
    tokens = set(_TOKEN.findall(text))
    for w in words:
        w = w.lower()
        if " " in w:
            if w in text:
                return True
        elif w.isascii():
            if any(t.startswith(w) for t in tokens):  # zip -> zipper, stitch -> stitching
                return True
        elif any(p + w in tokens for p in _AR_PREFIXES):
            return True
    return False


def recommend(description: str, quick_items: list[str], prefers_home: bool) -> dict:
    """Rule-based: picks the service a knowledgeable tailor would suggest, with the reason."""
    text = _norm(description or "")
    custom = _has(text, _CUSTOM_WORDS)
    measure = _has(text, _MEASURE_WORDS)
    quick = bool(quick_items) or _has(text, _QUICK_WORDS)

    if quick and not measure and not custom:
        return _rec(
            T.QUICK_FIX,
            "تصليح بسيط ما بيحتاج قياس، فبنستلمه منك وبنرجعه بسعر ثابت.",
            "A simple repair that needs no measuring: we collect it and bring it back at a fixed price.",
        )
    if custom:
        if prefers_home:
            return _rec(
                T.VAN_PICKUP,
                "التفصيل بيحتاج مشغل كامل، فالفان بيجي ياخد قياسك بالبيت وبياخد القطعة للمشغل.",
                "Custom work needs the full workshop, so the van measures you at home and takes the job back.",
            )
        return _rec(
            T.SHOP_VISIT,
            "التفصيل بيحتاج اختيار قماش وأكثر من بروفة، وهاد أسهل بالمحل.",
            "Custom tailoring means choosing fabric and several fittings, which is easiest at the shop.",
        )
    if measure:
        if prefers_home and _has(text, _ON_SITE_WORDS):
            return _rec(
                T.HOME_SERVICE,
                "هالتعديل بيخلص عادةً بأقل من ساعة، فالخيّاط بيقدر يعمله عندك بالبيت.",
                "This alteration usually takes under an hour, so the tailor can do it at your home.",
            )
        if prefers_home:
            return _rec(
                T.VAN_PICKUP,
                "بدها قياس دقيق وشغل بالمشغل، فالفان بيقيس عندك وبياخد القطعة وبيرجعها جاهزة.",
                "It needs precise measuring and workshop time: the van measures you and returns it ready.",
            )
        return _rec(
            T.SHOP_VISIT,
            "بدها قياس وبروفة، وبالمحل الخيّاط بيقيسك مباشرة.",
            "It needs measuring and a fitting, and at the shop the tailor fits you directly.",
        )
    if prefers_home:
        return _rec(
            T.VAN_PICKUP,
            "الفان بيجي لعندك، والخيّاط بيشوف القطعة وبيقرر شو بدها.",
            "The van comes to you and the tailor assesses the piece on the spot.",
        )
    return _rec(
        T.SHOP_VISIT,
        "زورنا بالمحل والخيّاط بيشوف القطعة وبيقلك شو بدها وكم بتكلف.",
        "Visit the shop and the tailor will look at the piece and tell you what it needs and costs.",
    )


def _rec(service_type: T, reason_ar: str, reason_en: str) -> dict:
    return {"service_type": service_type, "reason_ar": reason_ar, "reason_en": reason_en}


# --- Availability -----------------------------------------------------------------------


def _taken(db: Session, service_type: T, day: date) -> dict[str, int]:
    group = VAN_TYPES if service_type in VAN_TYPES else {T.SHOP_VISIT}
    rows = db.execute(
        select(Booking.slot, func.count())
        .where(Booking.scheduled_date == day, Booking.service_type.in_(group),
               Booking.status != CANCELLED)
        .group_by(Booking.slot)
    ).all()
    return dict(rows)


def availability(db: Session, service_type: T, day: date) -> list[dict]:
    now = now_damascus()
    capacity = (settings.shop_capacity_per_slot if service_type == T.SHOP_VISIT
                else settings.van_capacity_per_slot)
    open_day = (day.weekday() != CLOSED_WEEKDAY
                and now.date() <= day <= now.date() + timedelta(days=BOOKING_HORIZON_DAYS))
    taken = _taken(db, service_type, day) if open_day else {}
    result = []
    for slot in slots_for(service_type):
        hour = int(slot[:2])
        too_soon = day == now.date() and hour <= now.hour + 1  # at least an hour's notice
        available = open_day and not too_soon and taken.get(slot, 0) < capacity
        result.append({"slot": slot, "available": available})
    return result


# --- Creation ---------------------------------------------------------------------------


def _invalid(detail: str) -> ProblemError:
    return ProblemError(422, "Unprocessable Entity", detail, type_="validation")


def _reference(db: Session) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    while True:
        ref = "KH-" + "".join(secrets.choice(alphabet) for _ in range(6))
        if not db.scalar(select(Booking.id).where(Booking.reference == ref)):
            return ref


def estimate(service_type: T, quick_items: list[str]) -> tuple[Decimal | None, Decimal | None]:
    if service_type != T.QUICK_FIX or not quick_items:
        return None, None
    return (sum((QUICK_ITEMS_USD[i][0] for i in quick_items), Decimal(0)),
            sum((QUICK_ITEMS_USD[i][1] for i in quick_items), Decimal(0)))


def create_booking(db: Session, customer: User, data) -> Booking:
    service_type = T(data.service_type)
    items = list(dict.fromkeys(data.quick_items or []))
    unknown = set(items) - set(QUICK_ITEMS_USD)
    if unknown:
        raise _invalid(f"Unknown quick-fix items: {', '.join(sorted(unknown))}")
    description = (data.description or "").strip()
    if service_type == T.QUICK_FIX:
        if not items:
            raise _invalid("Pick at least one repair for a quick fix")
        description = description or ", ".join(items)
    elif len(description) < 10:
        raise _invalid("Describe what you need in at least 10 characters")

    if data.city not in settings.service_city_list:
        raise _invalid("We don't serve this city yet")
    if service_type in NEEDS_ADDRESS:
        if not (data.district and data.address_line):
            raise _invalid("An address (district and street) is needed for this service")
        if not data.contact_phone:
            raise _invalid("A phone number is needed so the van can reach you")
    if not all(is_own_media_url(u) for u in data.photo_urls):
        raise _invalid("Photos must be uploaded through /media/images first")

    slots = {s["slot"]: s["available"] for s in availability(db, service_type, data.scheduled_date)}
    if data.slot not in slots:
        raise _invalid("That time slot does not exist for this service")
    if not slots[data.slot]:
        raise Conflict("That time slot is no longer available, please pick another")

    low, high = estimate(service_type, items)
    booking = Booking(
        reference=_reference(db),
        customer_id=customer.id,
        service_type=service_type,
        status="submitted",
        description=description,
        garment=data.garment,
        quick_items=items,
        photo_urls=data.photo_urls,
        city=data.city,
        district=data.district if service_type in NEEDS_ADDRESS else None,
        address_line=data.address_line if service_type in NEEDS_ADDRESS else None,
        contact_phone=data.contact_phone,
        scheduled_date=data.scheduled_date,
        slot=data.slot,
        visit_fee_usd=VISIT_FEE_USD[service_type],
        estimate_min_usd=low,
        estimate_max_usd=high,
        recommended=data.followed_recommendation,
    )
    booking.events.append(BookingEvent(status="submitted", created_at=utcnow()))
    db.add(booking)
    db.commit()
    return booking


# --- Lookups ----------------------------------------------------------------------------


def get_for_customer(db: Session, user: User, booking_id: uuid.UUID) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None or booking.customer_id != user.id:
        raise NotFound("Booking not found")
    return booking


def get_any(db: Session, booking_id: uuid.UUID) -> Booking:
    booking = db.get(Booking, booking_id)
    if booking is None:
        raise NotFound("Booking not found")
    return booking


def next_status(booking: Booking) -> str | None:
    pipeline = PIPELINES[booking.service_type]
    if booking.status not in pipeline:
        return None
    i = pipeline.index(booking.status)
    return pipeline[i + 1] if i + 1 < len(pipeline) else None


# --- Status changes ---------------------------------------------------------------------


def _record(db: Session, booking: Booking, status: str, note: str | None = None) -> None:
    booking.status = status
    booking.events.append(BookingEvent(status=status, note=note, created_at=utcnow()))
    notify(db, booking.customer_id, "booking_status",
           {"reference": booking.reference, "status": status,
            "service_type": booking.service_type.value},
           link=f"/bookings/{booking.id}")


def advance(db: Session, booking: Booking, note: str | None, assignee: str | None) -> Booking:
    target = next_status(booking)
    if target is None:
        raise Conflict("This booking is already finished")
    if assignee:
        booking.assignee_name = assignee
    if target == "completed":
        booking.completed_at = utcnow()
        if booking.final_price_usd is None and booking.estimate_max_usd is not None:
            booking.final_price_usd = booking.estimate_max_usd
    _record(db, booking, target, note)
    db.commit()
    return booking


def cancel(db: Session, booking: Booking, by_staff: bool, reason: str | None) -> Booking:
    if booking.status == CANCELLED or booking.status == "completed":
        raise Conflict("This booking can no longer be cancelled")
    if not by_staff and booking.status not in CUSTOMER_CANCELLABLE:
        raise Conflict("The work has started; message us to change this booking")
    booking.cancel_reason = reason
    _record(db, booking, CANCELLED, reason)
    db.commit()
    return booking


def set_price(db: Session, booking: Booking, price: Decimal) -> Booking:
    if booking.status == CANCELLED:
        raise Conflict("This booking is cancelled")
    if booking.payment_status == PaymentStatus.PAID:
        raise Conflict("This booking is already paid")
    booking.final_price_usd = price
    notify(db, booking.customer_id, "booking_price",
           {"reference": booking.reference, "price_usd": str(price)},
           link=f"/bookings/{booking.id}")
    db.commit()
    return booking


def mark_paid(db: Session, booking: Booking) -> Booking:
    if booking.status != "completed":
        raise Conflict("Payment is collected once the service is completed")
    if booking.payment_status == PaymentStatus.PAID:
        raise Conflict("This booking is already paid")
    booking.payment_status = PaymentStatus.PAID
    booking.paid_at = utcnow()
    notify(db, booking.customer_id, "booking_paid", {"reference": booking.reference},
           link=f"/bookings/{booking.id}")
    db.commit()
    return booking


def review(db: Session, user: User, booking: Booking, rating: int, comment: str | None) -> Booking:
    if booking.customer_id != user.id:
        raise Forbidden()
    if booking.status != "completed":
        raise Conflict("You can review once the service is completed")
    if booking.rating is not None:
        raise Conflict("You have already reviewed this booking")
    booking.rating = rating
    booking.review_comment = comment
    booking.reviewed_at = utcnow()
    db.commit()
    return booking

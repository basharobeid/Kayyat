import uuid
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import String, cast, delete, func, or_, select

from app.api.deps import DbSession, require_roles
from app.core.constants import CITIES, SPECIALTIES
from app.core.exceptions import Conflict, NotFound, ProblemError
from app.models import (
    JobRequest,
    Order,
    OrderStatus,
    PortfolioItem,
    Quote,
    Review,
    RoleName,
    Service,
    TailorProfile,
    TailorService,
    User,
)
from app.models.enums import VerificationLevel
from app.schemas.catalog import ServiceRead
from app.schemas.common import Page, PageParams, first_name, paginate
from app.schemas.marketplace import QuoteRead, RequestRead
from app.schemas.tailor import (
    Earnings,
    PortfolioCreate,
    PortfolioRead,
    ReviewPublic,
    TailorDetail,
    TailorProfileUpdate,
    TailorServiceRead,
    TailorServicesReplace,
    TailorSummary,
)
from app.services.marketplace_service import OPEN_STATES
from app.services.serializers import quote_reads, request_read

router = APIRouter(prefix="/tailors", tags=["tailors"])

TailorUser = Annotated[User, Depends(require_roles(RoleName.TAILOR))]
MAX_PORTFOLIO_ITEMS = 30


def _summary(profile: TailorProfile, price_from: Decimal | None) -> TailorSummary:
    user = profile.user
    return TailorSummary(
        id=user.id, name=user.full_name, business_name=profile.business_name,
        avatar_url=user.avatar_url, city=profile.city, rating_avg=profile.rating_avg,
        rating_count=profile.rating_count, verification_level=profile.verification_level,
        specialties=profile.specialties, years_experience=profile.years_experience,
        offers_pickup=profile.offers_pickup, offers_delivery=profile.offers_delivery,
        price_from=price_from, bio=profile.bio,
    )


def _detail(db: DbSession, profile: TailorProfile) -> TailorDetail:
    services = db.scalars(
        select(TailorService).join(Service)
        .where(TailorService.tailor_id == profile.user_id)
        .order_by(Service.sort_order)
    ).all()
    portfolio = db.scalars(
        select(PortfolioItem).where(PortfolioItem.tailor_id == profile.user_id)
        .order_by(PortfolioItem.created_at.desc(), PortfolioItem.id.desc())
    ).all()
    price_from = min((s.price_from for s in services), default=None)
    return TailorDetail(
        **_summary(profile, price_from).model_dump(),
        services=[TailorServiceRead(service=ServiceRead.of(s.service), price_from=s.price_from,
                                    duration_days=s.duration_days) for s in services],
        portfolio=[PortfolioRead(id=p.id, image_url=p.image_url, title=p.title,
                                 description=p.description, created_at=p.created_at)
                   for p in portfolio],
        member_since=profile.user.created_at,
    )


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


# --- Public search ---------------------------------------------------------------------------


@router.get("", response_model=Page[TailorSummary])
def search_tailors(
    db: DbSession,
    params: Annotated[PageParams, Depends()],
    q: Annotated[str | None, Query(max_length=100)] = None,
    city: Annotated[str | None, Query()] = None,
    service: Annotated[str | None, Query(description="Service slug")] = None,
    specialty: Annotated[str | None, Query()] = None,
    min_rating: Annotated[float | None, Query(ge=0, le=5)] = None,
    delivery: bool = False,
    pickup: bool = False,
    verified: bool = False,
    sort: Literal["rating", "reviews", "experience", "newest", "price"] = "rating",
) -> Page[TailorSummary]:
    empty = Page[TailorSummary](items=[], total=0, page=params.page, per_page=params.per_page,
                                pages=1)
    if (city and city not in CITIES) or (specialty and specialty not in SPECIALTIES):
        return empty

    price_sq = select(func.min(TailorService.price_from)).where(
        TailorService.tailor_id == TailorProfile.user_id
    )
    stmt = select(TailorProfile).join(User, User.id == TailorProfile.user_id).where(
        User.is_active.is_(True)
    )
    if service:
        service_id = db.scalar(select(Service.id).where(Service.slug == service))
        if service_id is None:
            return empty
        price_sq = price_sq.where(TailorService.service_id == service_id)
        stmt = stmt.where(
            select(TailorService.tailor_id).where(
                TailorService.tailor_id == TailorProfile.user_id,
                TailorService.service_id == service_id,
            ).exists()
        )
    price_col = price_sq.correlate(TailorProfile).scalar_subquery().label("price_from")
    stmt = stmt.add_columns(price_col)

    if q and q.strip():
        term = f"%{_escape_like(q.strip())}%"
        stmt = stmt.where(or_(
            TailorProfile.business_name.ilike(term, escape="\\"),
            User.full_name.ilike(term, escape="\\"),
            TailorProfile.bio.ilike(term, escape="\\"),
        ))
    if city:
        stmt = stmt.where(TailorProfile.city == city)
    if specialty:
        # Works for JSON text on SQLite and JSONB::text on Postgres; slug is whitelisted above.
        stmt = stmt.where(cast(TailorProfile.specialties, String).like(f'%"{specialty}"%'))
    if min_rating is not None:
        stmt = stmt.where(TailorProfile.rating_avg >= min_rating)
    if delivery:
        stmt = stmt.where(TailorProfile.offers_delivery.is_(True))
    if pickup:
        stmt = stmt.where(TailorProfile.offers_pickup.is_(True))
    if verified:
        stmt = stmt.where(TailorProfile.verification_level != VerificationLevel.NONE)

    order_by = {
        "rating": (TailorProfile.rating_avg.desc(), TailorProfile.rating_count.desc()),
        "reviews": (TailorProfile.rating_count.desc(), TailorProfile.rating_avg.desc()),
        "experience": (TailorProfile.years_experience.desc().nulls_last(),),
        "newest": (User.created_at.desc(),),
        "price": (price_col.asc().nulls_last(),),
    }[sort]
    stmt = stmt.order_by(*order_by, TailorProfile.user_id)

    rows, meta = paginate(db, stmt, params, scalars=False)
    return Page[TailorSummary](items=[_summary(p, price) for p, price in rows], **meta)


# --- Own profile (declared before /{tailor_id} routes) ---------------------------------------


def _own_profile(db: DbSession, user: User) -> TailorProfile:
    profile = db.get(TailorProfile, user.id)
    if profile is None:
        profile = TailorProfile(user_id=user.id, business_name=user.full_name)
        db.add(profile)
        db.flush()
    return profile


@router.get("/me/profile", response_model=TailorDetail)
def get_my_profile(user: TailorUser, db: DbSession) -> TailorDetail:
    return _detail(db, _own_profile(db, user))


@router.patch("/me/profile", response_model=TailorDetail)
def update_my_profile(data: TailorProfileUpdate, user: TailorUser, db: DbSession) -> TailorDetail:
    profile = _own_profile(db, user)
    changes = data.model_dump(exclude_unset=True)
    if changes.get("business_name") is None:
        changes.pop("business_name", None)
    for field, value in changes.items():
        setattr(profile, field, value)
    db.commit()
    return _detail(db, profile)


@router.put("/me/services", response_model=TailorDetail)
def replace_my_services(
    data: TailorServicesReplace, user: TailorUser, db: DbSession
) -> TailorDetail:
    profile = _own_profile(db, user)
    ids = [i.service_id for i in data.items]
    if len(ids) != len(set(ids)):
        raise Conflict("Each service can only be listed once")
    active = set(db.scalars(select(Service.id).where(Service.id.in_(ids),
                                                     Service.is_active.is_(True))))
    if missing := set(ids) - active:
        raise NotFound(f"Unknown services: {sorted(missing)}")

    db.execute(delete(TailorService).where(TailorService.tailor_id == user.id))
    for item in data.items:
        db.add(TailorService(tailor_id=user.id, **item.model_dump()))
    db.commit()
    db.expire_all()
    return _detail(db, profile)


@router.post("/me/portfolio", response_model=PortfolioRead, status_code=status.HTTP_201_CREATED)
def add_portfolio_item(data: PortfolioCreate, user: TailorUser, db: DbSession) -> PortfolioRead:
    _own_profile(db, user)
    count = db.scalar(select(func.count()).where(PortfolioItem.tailor_id == user.id))
    if count >= MAX_PORTFOLIO_ITEMS:
        raise ProblemError(409, "Limit Reached",
                           f"A portfolio can hold up to {MAX_PORTFOLIO_ITEMS} items",
                           type_="limit-reached")
    item = PortfolioItem(tailor_id=user.id, **data.model_dump())
    db.add(item)
    db.commit()
    return PortfolioRead(id=item.id, image_url=item.image_url, title=item.title,
                         description=item.description, created_at=item.created_at)


@router.delete("/me/portfolio/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_portfolio_item(item_id: uuid.UUID, user: TailorUser, db: DbSession) -> None:
    item = db.get(PortfolioItem, item_id)
    if item is None or item.tailor_id != user.id:
        raise NotFound("Portfolio item not found")
    db.delete(item)
    db.commit()


@router.get("/me/requests", response_model=Page[RequestRead])
def request_feed(
    user: TailorUser,
    db: DbSession,
    params: Annotated[PageParams, Depends()],
    city: str | None = None,
    all_cities: bool = False,
    service_id: int | None = None,
) -> Page[RequestRead]:
    """Open requests a tailor can quote on. Defaults to the tailor's own city."""
    profile = _own_profile(db, user)
    stmt = select(JobRequest).where(
        JobRequest.status.in_(OPEN_STATES), JobRequest.customer_id != user.id
    )
    city = city or (None if all_cities else profile.city)
    if city:
        stmt = stmt.where(JobRequest.city == city)
    if service_id:
        stmt = stmt.where(JobRequest.service_id == service_id)
    rows, meta = paginate(
        db, stmt.order_by(JobRequest.created_at.desc(), JobRequest.id.desc()), params
    )
    return Page[RequestRead](items=[request_read(db, r, user) for r in rows], **meta)


@router.get("/me/quotes", response_model=Page[QuoteRead])
def my_quotes(
    user: TailorUser, db: DbSession, params: Annotated[PageParams, Depends()]
) -> Page[QuoteRead]:
    stmt = select(Quote).where(Quote.tailor_id == user.id).order_by(Quote.updated_at.desc())
    rows, meta = paginate(db, stmt, params)
    return Page[QuoteRead](items=quote_reads(db, rows), **meta)


@router.get("/me/earnings", response_model=Earnings)
def my_earnings(user: TailorUser, db: DbSession) -> Earnings:
    def total(column, *statuses_in, exclude=()):
        stmt = select(func.coalesce(func.sum(column), 0)).where(Order.tailor_id == user.id)
        if statuses_in:
            stmt = stmt.where(Order.status.in_(statuses_in))
        if exclude:
            stmt = stmt.where(Order.status.not_in(exclude))
        return Decimal(str(db.scalar(stmt)))

    finished = (OrderStatus.COMPLETED, OrderStatus.CANCELLED)
    return Earnings(
        completed_orders=db.scalar(select(func.count()).where(
            Order.tailor_id == user.id, Order.status == OrderStatus.COMPLETED)),
        active_orders=db.scalar(select(func.count()).where(
            Order.tailor_id == user.id, Order.status.not_in(finished))),
        total_earned=total(Order.tailor_payout, OrderStatus.COMPLETED),
        pending_payout=total(Order.tailor_payout, exclude=finished),
        total_commission=total(Order.commission_amount, OrderStatus.COMPLETED),
    )


# --- Public profile ----------------------------------------------------------------------------


def _public_profile(db: DbSession, tailor_id: uuid.UUID) -> TailorProfile:
    profile = db.get(TailorProfile, tailor_id)
    if profile is None or not profile.user.is_active:
        raise NotFound("Tailor not found")
    return profile


@router.get("/{tailor_id}", response_model=TailorDetail)
def get_tailor(tailor_id: uuid.UUID, db: DbSession) -> TailorDetail:
    return _detail(db, _public_profile(db, tailor_id))


@router.get("/{tailor_id}/reviews", response_model=Page[ReviewPublic])
def tailor_reviews(
    tailor_id: uuid.UUID, db: DbSession, params: Annotated[PageParams, Depends()]
) -> Page[ReviewPublic]:
    _public_profile(db, tailor_id)
    stmt = (
        select(Review)
        .where(Review.target_user_id == tailor_id, Review.is_hidden.is_(False))
        .order_by(Review.created_at.desc(), Review.id.desc())
    )
    rows, meta = paginate(db, stmt, params)
    return Page[ReviewPublic](
        items=[ReviewPublic(id=r.id, rating=r.rating, comment=r.comment,
                            author_name=first_name(r.author.full_name), created_at=r.created_at)
               for r in rows],
        **meta,
    )

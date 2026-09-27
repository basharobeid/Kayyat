"""Admin panel API. Every mutation writes an audit log entry (blueprint 12.1)."""

import json
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy import func, or_, select

from app.api.deps import DbSession, require_roles
from app.api.v1.catalog import categories_with_services
from app.core.exceptions import Conflict, Forbidden, NotFound
from app.models import (
    AuditLog,
    JobRequest,
    Order,
    OrderStatus,
    RequestStatus,
    Review,
    Role,
    RoleName,
    Service,
    ServiceCategory,
    TailorProfile,
    User,
)
from app.models.enums import VerificationLevel
from app.schemas.catalog import CategoryRead, ServiceCreate, ServiceRead, ServiceUpdate
from app.schemas.common import Money, Page, PageParams, first_name, paginate
from app.schemas.marketplace import OrderRead, RequestRead
from app.schemas.user import UserRead
from app.services import auth_service
from app.services.marketplace_service import recompute_rating
from app.services.notification_service import notify
from app.services.serializers import order_read, request_read

AdminUser = Annotated[User, Depends(require_roles(RoleName.ADMIN))]
router = APIRouter(prefix="/admin", tags=["admin"])


def audit(db: DbSession, actor: User, action: str, target_type: str, target_id, **details):
    db.add(AuditLog(actor_id=actor.id, action=action, target_type=target_type,
                    target_id=str(target_id),
                    details=json.dumps(details, default=str, ensure_ascii=False) or None))


# --- Dashboard ---------------------------------------------------------------------------------


class Stats(BaseModel):
    users_by_role: dict[str, int]
    new_users_7d: int
    tailors_unverified: int
    requests_by_status: dict[str, int]
    new_requests_7d: int
    orders_by_status: dict[str, int]
    gmv: Money
    commission: Money
    average_rating: float | None
    reviews: int


@router.get("/stats", response_model=Stats)
def stats(_: AdminUser, db: DbSession) -> Stats:
    week_ago = datetime.now(UTC) - timedelta(days=7)
    users_by_role = dict(db.execute(
        select(Role.name, func.count()).join(User.roles).group_by(Role.name)
    ).tuples().all())
    completed = Order.status == OrderStatus.COMPLETED
    avg_rating, reviews = db.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(Review.is_hidden.is_(False))
    ).one()
    return Stats(
        users_by_role={r.value: users_by_role.get(r, 0) for r in RoleName},
        new_users_7d=db.scalar(select(func.count()).where(User.created_at >= week_ago)),
        tailors_unverified=db.scalar(select(func.count()).where(
            TailorProfile.verification_level == VerificationLevel.NONE)),
        requests_by_status={s.value: n for s, n in db.execute(
            select(JobRequest.status, func.count()).group_by(JobRequest.status)).tuples()},
        new_requests_7d=db.scalar(select(func.count()).where(JobRequest.created_at >= week_ago)),
        orders_by_status={s.value: n for s, n in db.execute(
            select(Order.status, func.count()).group_by(Order.status)).tuples()},
        gmv=Decimal(str(db.scalar(select(func.coalesce(func.sum(Order.price), 0))
                                  .where(completed)))),
        commission=Decimal(str(db.scalar(
            select(func.coalesce(func.sum(Order.commission_amount), 0)).where(completed)))),
        average_rating=round(float(avg_rating), 2) if avg_rating is not None else None,
        reviews=reviews,
    )


# --- Users ---------------------------------------------------------------------------------------


class AdminUserRead(UserRead):
    is_active: bool
    last_login_at: datetime | None
    verification_level: VerificationLevel | None
    business_name: str | None


class AdminUserUpdate(BaseModel):
    is_active: bool


class VerificationUpdate(BaseModel):
    level: VerificationLevel


def _admin_user(db: DbSession, user: User) -> AdminUserRead:
    profile = db.get(TailorProfile, user.id)
    return AdminUserRead(
        **UserRead.from_user(user).model_dump(),
        is_active=user.is_active, last_login_at=user.last_login_at,
        verification_level=profile.verification_level if profile else None,
        business_name=profile.business_name if profile else None,
    )


@router.get("/users", response_model=Page[AdminUserRead])
def list_users(
    _: AdminUser, db: DbSession, params: Annotated[PageParams, Depends()],
    q: str | None = None, role: RoleName | None = None,
) -> Page[AdminUserRead]:
    stmt = select(User)
    if q and q.strip():
        term = f"%{q.strip()}%"
        stmt = stmt.where(or_(User.full_name.ilike(term), User.email.ilike(term),
                              User.phone.ilike(term)))
    if role:
        stmt = stmt.where(User.roles.any(Role.name == role))
    rows, meta = paginate(db, stmt.order_by(User.created_at.desc(), User.id.desc()), params)
    return Page[AdminUserRead](items=[_admin_user(db, u) for u in rows], **meta)


@router.patch("/users/{user_id}", response_model=AdminUserRead)
def update_user(
    user_id: uuid.UUID, data: AdminUserUpdate, admin: AdminUser, db: DbSession
) -> AdminUserRead:
    user = db.get(User, user_id)
    if user is None:
        raise NotFound("User not found")
    if user.id == admin.id and not data.is_active:
        raise Forbidden("You cannot deactivate your own account")
    if user.is_active != data.is_active:
        user.is_active = data.is_active
        audit(db, admin, "user.activate" if data.is_active else "user.deactivate", "user", user.id)
        db.commit()
        if not data.is_active:
            auth_service.logout_all(db, user)  # kill existing sessions immediately
    return _admin_user(db, user)


@router.patch("/tailors/{user_id}/verification", response_model=AdminUserRead)
def verify_tailor(
    user_id: uuid.UUID, data: VerificationUpdate, admin: AdminUser, db: DbSession
) -> AdminUserRead:
    profile = db.get(TailorProfile, user_id)
    if profile is None:
        raise NotFound("Tailor not found")
    previous = profile.verification_level
    profile.verification_level = data.level
    audit(db, admin, "tailor.verification", "user", user_id,
          previous=previous.value, level=data.level.value)
    if data.level != VerificationLevel.NONE and previous == VerificationLevel.NONE:
        notify(db, user_id, "verified", {"level": data.level.value}, "/dashboard")
    db.commit()
    return _admin_user(db, profile.user)


# --- Marketplace oversight -----------------------------------------------------------------------


@router.get("/requests", response_model=Page[RequestRead])
def list_requests(
    admin: AdminUser, db: DbSession, params: Annotated[PageParams, Depends()],
    status_: Annotated[RequestStatus | None, Query(alias="status")] = None,
) -> Page[RequestRead]:
    stmt = select(JobRequest).order_by(JobRequest.created_at.desc(), JobRequest.id.desc())
    if status_:
        stmt = stmt.where(JobRequest.status == status_)
    rows, meta = paginate(db, stmt, params)
    return Page[RequestRead](items=[request_read(db, r, admin) for r in rows], **meta)


@router.get("/orders", response_model=Page[OrderRead])
def list_orders(
    _: AdminUser, db: DbSession, params: Annotated[PageParams, Depends()],
    status_: Annotated[OrderStatus | None, Query(alias="status")] = None,
) -> Page[OrderRead]:
    stmt = select(Order).order_by(Order.created_at.desc(), Order.id.desc())
    if status_:
        stmt = stmt.where(Order.status == status_)
    rows, meta = paginate(db, stmt, params)
    return Page[OrderRead](items=[order_read(db, o, "admin", detail=False) for o in rows], **meta)


class AdminReviewRead(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    rating: int
    comment: str | None
    author_name: str
    target_name: str
    is_hidden: bool
    created_at: datetime


class ReviewModeration(BaseModel):
    is_hidden: bool


def _admin_review(db: DbSession, r: Review) -> AdminReviewRead:
    target = db.get(User, r.target_user_id)
    return AdminReviewRead(id=r.id, order_id=r.order_id, rating=r.rating, comment=r.comment,
                           author_name=r.author.full_name,
                           target_name=first_name(target.full_name) if target else "",
                           is_hidden=r.is_hidden, created_at=r.created_at)


@router.get("/reviews", response_model=Page[AdminReviewRead])
def list_reviews(
    _: AdminUser, db: DbSession, params: Annotated[PageParams, Depends()]
) -> Page[AdminReviewRead]:
    rows, meta = paginate(
        db, select(Review).order_by(Review.created_at.desc(), Review.id.desc()), params
    )
    return Page[AdminReviewRead](items=[_admin_review(db, r) for r in rows], **meta)


@router.patch("/reviews/{review_id}", response_model=AdminReviewRead)
def moderate_review(
    review_id: uuid.UUID, data: ReviewModeration, admin: AdminUser, db: DbSession
) -> AdminReviewRead:
    review = db.get(Review, review_id)
    if review is None:
        raise NotFound("Review not found")
    review.is_hidden = data.is_hidden
    db.flush()
    recompute_rating(db, review.target_user_id)
    audit(db, admin, "review.hide" if data.is_hidden else "review.show", "review", review.id)
    db.commit()
    return _admin_review(db, review)


# --- Service catalog -----------------------------------------------------------------------------


@router.get("/services", response_model=list[CategoryRead])
def all_services(_: AdminUser, db: DbSession) -> list[CategoryRead]:
    return categories_with_services(db, include_inactive=True)


@router.post("/services", response_model=ServiceRead, status_code=status.HTTP_201_CREATED)
def create_service(data: ServiceCreate, admin: AdminUser, db: DbSession) -> ServiceRead:
    if db.get(ServiceCategory, data.category_id) is None:
        raise NotFound("Category not found")
    if db.scalar(select(Service.id).where(Service.slug == data.slug)):
        raise Conflict("A service with this slug already exists")
    service = Service(**data.model_dump())
    db.add(service)
    db.flush()
    audit(db, admin, "service.create", "service", service.id, slug=service.slug)
    db.commit()
    return ServiceRead.of(service)


@router.patch("/services/{service_id}", response_model=ServiceRead)
def update_service(
    service_id: int, data: ServiceUpdate, admin: AdminUser, db: DbSession
) -> ServiceRead:
    service = db.get(Service, service_id)
    if service is None:
        raise NotFound("Service not found")
    changes = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    for field, value in changes.items():
        setattr(service, field, value)
    audit(db, admin, "service.update", "service", service.id, **changes)
    db.commit()
    return ServiceRead.of(service)


# --- Audit log -----------------------------------------------------------------------------------


class AuditLogRead(BaseModel):
    id: uuid.UUID
    actor_name: str | None
    action: str
    target_type: str
    target_id: str
    details: str | None
    created_at: datetime


@router.get("/audit-logs", response_model=Page[AuditLogRead])
def audit_logs(
    _: AdminUser, db: DbSession, params: Annotated[PageParams, Depends()]
) -> Page[AuditLogRead]:
    rows, meta = paginate(
        db,
        select(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc()),
        params,
    )
    names = dict(db.execute(select(User.id, User.full_name).where(
        User.id.in_({r.actor_id for r in rows if r.actor_id}))).tuples().all())
    return Page[AuditLogRead](
        items=[AuditLogRead(id=r.id, actor_name=names.get(r.actor_id), action=r.action,
                            target_type=r.target_type, target_id=r.target_id,
                            details=r.details, created_at=r.created_at) for r in rows],
        **meta,
    )

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, status
from sqlalchemy import or_, select

from app.api.deps import CurrentUser, DbSession
from app.models import Order, OrderStatus
from app.schemas.common import Page, PageParams, paginate
from app.schemas.marketplace import OrderRead, OrderStatusUpdate, ReviewCreate
from app.services import marketplace_service as svc
from app.services.serializers import order_read

router = APIRouter(tags=["orders"])


@router.get("/orders", response_model=Page[OrderRead])
def my_orders(
    user: CurrentUser,
    db: DbSession,
    params: Annotated[PageParams, Depends()],
    state: Literal["all", "active", "finished"] = "all",
) -> Page[OrderRead]:
    stmt = select(Order).where(or_(Order.customer_id == user.id, Order.tailor_id == user.id))
    if state != "all":
        condition = Order.status.in_(svc.FINAL_ORDER_STATES)
        stmt = stmt.where(condition if state == "finished" else ~condition)
    rows, meta = paginate(db, stmt.order_by(Order.created_at.desc(), Order.id.desc()), params)
    return Page[OrderRead](
        items=[order_read(db, o, svc.viewer_role(user, o), detail=False) for o in rows], **meta
    )


@router.get("/orders/{order_id}", response_model=OrderRead)
def get_order(order_id: uuid.UUID, user: CurrentUser, db: DbSession) -> OrderRead:
    order, role = svc.get_order_for(db, user, order_id)
    return order_read(db, order, role)


@router.post("/orders/{order_id}/status", response_model=OrderRead)
def update_status(
    order_id: uuid.UUID, data: OrderStatusUpdate, user: CurrentUser, db: DbSession
) -> OrderRead:
    order, role = svc.get_order_for(db, user, order_id)
    svc.change_order_status(db, user, order, role, data.status, data.note)
    return order_read(db, order, role)


@router.post("/orders/{order_id}/cancel", response_model=OrderRead)
def cancel_order(order_id: uuid.UUID, user: CurrentUser, db: DbSession) -> OrderRead:
    order, role = svc.get_order_for(db, user, order_id)
    svc.change_order_status(db, user, order, role, OrderStatus.CANCELLED, None)
    return order_read(db, order, role)


@router.post("/reviews", status_code=status.HTTP_201_CREATED)
def create_review(data: ReviewCreate, user: CurrentUser, db: DbSession) -> dict:
    review = svc.create_review(db, user, data)
    return {"id": str(review.id), "rating": review.rating}

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, require_roles
from app.core.exceptions import NotFound
from app.models import JobRequest, Quote, RoleName, User
from app.schemas.common import Page, PageParams, paginate
from app.schemas.marketplace import OrderRead, QuoteCreate, QuoteRead, RequestCreate, RequestRead
from app.services import marketplace_service as svc
from app.services.serializers import order_read, quote_reads, request_read

router = APIRouter(tags=["requests"])

CustomerUser = Annotated[User, Depends(require_roles(RoleName.CUSTOMER))]
TailorUser = Annotated[User, Depends(require_roles(RoleName.TAILOR))]


def _visible_request(db: DbSession, user: User, request_id: uuid.UUID) -> JobRequest:
    request = db.get(JobRequest, request_id)
    if request is None or not svc.can_view_request(user, request):
        raise NotFound("Request not found")
    return request


@router.post("/requests", response_model=RequestRead, status_code=status.HTTP_201_CREATED)
def create_request(data: RequestCreate, user: CustomerUser, db: DbSession) -> RequestRead:
    return request_read(db, svc.create_request(db, user, data), user)


@router.get("/requests", response_model=Page[RequestRead])
def my_requests(
    user: CurrentUser, db: DbSession, params: Annotated[PageParams, Depends()]
) -> Page[RequestRead]:
    stmt = (
        select(JobRequest)
        .where(JobRequest.customer_id == user.id)
        .order_by(JobRequest.created_at.desc(), JobRequest.id.desc())
    )
    rows, meta = paginate(db, stmt, params)
    return Page[RequestRead](items=[request_read(db, r, user) for r in rows], **meta)


@router.get("/requests/{request_id}", response_model=RequestRead)
def get_request(request_id: uuid.UUID, user: CurrentUser, db: DbSession) -> RequestRead:
    return request_read(db, _visible_request(db, user, request_id), user)


@router.post("/requests/{request_id}/cancel", response_model=RequestRead)
def cancel_request(request_id: uuid.UUID, user: CurrentUser, db: DbSession) -> RequestRead:
    request = _visible_request(db, user, request_id)
    return request_read(db, svc.cancel_request(db, user, request), user)


@router.post(
    "/requests/{request_id}/quotes", response_model=QuoteRead, status_code=status.HTTP_201_CREATED
)
def submit_quote(
    request_id: uuid.UUID, data: QuoteCreate, user: TailorUser, db: DbSession
) -> QuoteRead:
    request = _visible_request(db, user, request_id)
    quote = svc.submit_quote(db, user, request, data)
    return quote_reads(db, [quote])[0]


def _quote(db: DbSession, quote_id: uuid.UUID) -> Quote:
    quote = db.get(Quote, quote_id)
    if quote is None:
        raise NotFound("Quote not found")
    return quote


@router.post("/quotes/{quote_id}/accept", response_model=OrderRead)
def accept_quote(quote_id: uuid.UUID, user: CustomerUser, db: DbSession) -> OrderRead:
    order = svc.accept_quote(db, user, _quote(db, quote_id))
    return order_read(db, order, "customer")


@router.post("/quotes/{quote_id}/withdraw", response_model=QuoteRead)
def withdraw_quote(quote_id: uuid.UUID, user: TailorUser, db: DbSession) -> QuoteRead:
    quote = svc.withdraw_quote(db, user, _quote(db, quote_id))
    return quote_reads(db, [quote])[0]

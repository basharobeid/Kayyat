import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import and_, func, or_, select, update

from app.api.deps import CurrentUser, DbSession, require_roles
from app.core.exceptions import NotFound
from app.models import Conversation, Message, Notification, RoleName, TailorProfile, User
from app.schemas.common import Page, PageParams, paginate
from app.schemas.marketplace import (
    ConversationCreate,
    ConversationRead,
    MessageCreate,
    MessageRead,
    NotificationRead,
)
from app.services.marketplace_service import get_or_create_conversation
from app.services.notification_service import notify_message
from app.services.serializers import user_brief

router = APIRouter(tags=["messages"])


def _now() -> datetime:
    return datetime.now(UTC)


def _participant(db: DbSession, user: User, conversation_id: uuid.UUID) -> Conversation:
    conversation = db.get(Conversation, conversation_id)
    if conversation is None or user.id not in (conversation.customer_id, conversation.tailor_id):
        raise NotFound("Conversation not found")
    return conversation


def _is_customer_side(user: User, c: Conversation) -> bool:
    return c.customer_id == user.id


def _read(db: DbSession, user: User, c: Conversation, unread: int, last: str | None):
    customer_side = _is_customer_side(user, c)
    other = c.tailor if customer_side else c.customer
    business = None
    if customer_side:
        business = db.scalar(
            select(TailorProfile.business_name).where(TailorProfile.user_id == c.tailor_id)
        )
    return ConversationRead(
        id=c.id, other=user_brief(other), other_business_name=business,
        request_id=c.request_id, request_title=c.request.title if c.request else None,
        last_message=last, last_message_at=c.last_message_at, unread=unread,
    )


def _unread_counts(db: DbSession, user: User, ids: list[uuid.UUID]) -> dict[uuid.UUID, int]:
    if not ids:
        return {}
    # The viewer's read marker is whichever side of the conversation they are on.
    stmt = (
        select(Message.conversation_id, func.count(Message.id))
        .join(Conversation, Conversation.id == Message.conversation_id)
        .where(
            Message.conversation_id.in_(ids),
            Message.sender_id != user.id,
            or_(
                and_(Conversation.customer_id == user.id,
                     or_(Conversation.customer_last_read_at.is_(None),
                         Message.created_at > Conversation.customer_last_read_at)),
                and_(Conversation.tailor_id == user.id,
                     or_(Conversation.tailor_last_read_at.is_(None),
                         Message.created_at > Conversation.tailor_last_read_at)),
            ),
        )
        .group_by(Message.conversation_id)
    )
    return dict(db.execute(stmt).tuples().all())


def _last_messages(db: DbSession, ids: list[uuid.UUID]) -> dict[uuid.UUID, str]:
    if not ids:
        return {}
    latest = (
        select(Message.conversation_id, func.max(Message.created_at).label("at"))
        .where(Message.conversation_id.in_(ids))
        .group_by(Message.conversation_id)
        .subquery()
    )
    rows = db.execute(
        select(Message.conversation_id, Message.body).join(
            latest,
            and_(Message.conversation_id == latest.c.conversation_id,
                 Message.created_at == latest.c.at),
        )
    )
    return dict(rows.tuples().all())


@router.get("/conversations", response_model=Page[ConversationRead])
def list_conversations(
    user: CurrentUser, db: DbSession, params: Annotated[PageParams, Depends()]
) -> Page[ConversationRead]:
    stmt = (
        select(Conversation)
        .where(or_(Conversation.customer_id == user.id, Conversation.tailor_id == user.id))
        .order_by(Conversation.last_message_at.desc().nulls_last(),
                  Conversation.created_at.desc(), Conversation.id.desc())
    )
    rows, meta = paginate(db, stmt, params)
    ids = [c.id for c in rows]
    unread, last = _unread_counts(db, user, ids), _last_messages(db, ids)
    return Page[ConversationRead](
        items=[_read(db, user, c, unread.get(c.id, 0), last.get(c.id)) for c in rows], **meta
    )


@router.post("/conversations", response_model=ConversationRead)
def start_conversation(
    data: ConversationCreate,
    user: Annotated[User, Depends(require_roles(RoleName.CUSTOMER))],
    db: DbSession,
) -> ConversationRead:
    """Customers can message a tailor directly (tailors reach customers via quotes only)."""
    tailor = db.get(TailorProfile, data.tailor_id)
    if tailor is None or not tailor.user.is_active or data.tailor_id == user.id:
        raise NotFound("Tailor not found")
    conversation = get_or_create_conversation(db, user.id, data.tailor_id, None)
    db.commit()
    return _read(db, user, conversation, 0, None)


@router.get("/conversations/unread-count")
def unread_total(user: CurrentUser, db: DbSession) -> dict[str, int]:
    ids = list(db.scalars(select(Conversation.id).where(
        or_(Conversation.customer_id == user.id, Conversation.tailor_id == user.id))))
    return {"unread": sum(_unread_counts(db, user, ids).values())}


@router.get("/conversations/{conversation_id}", response_model=ConversationRead)
def get_conversation(
    conversation_id: uuid.UUID, user: CurrentUser, db: DbSession
) -> ConversationRead:
    c = _participant(db, user, conversation_id)
    return _read(db, user, c, _unread_counts(db, user, [c.id]).get(c.id, 0),
                 _last_messages(db, [c.id]).get(c.id))


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageRead])
def list_messages(
    conversation_id: uuid.UUID,
    user: CurrentUser,
    db: DbSession,
    after: Annotated[datetime | None, Query(description="Only messages newer than this")] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 100,
) -> list[MessageRead]:
    """Oldest-first. Poll with ?after=<created_at of last message> for new ones."""
    _participant(db, user, conversation_id)
    stmt = select(Message).where(Message.conversation_id == conversation_id)
    if after is not None:
        stmt = stmt.where(Message.created_at > after)
        rows = list(db.scalars(stmt.order_by(Message.created_at).limit(limit)))
    else:  # latest `limit` messages
        rows = list(db.scalars(
            stmt.order_by(Message.created_at.desc(), Message.id.desc()).limit(limit)
        ))[::-1]
    return [MessageRead(id=m.id, sender_id=m.sender_id, body=m.body, created_at=m.created_at,
                        is_mine=m.sender_id == user.id) for m in rows]


@router.post("/conversations/{conversation_id}/messages", response_model=MessageRead,
             status_code=status.HTTP_201_CREATED)
def send_message(
    conversation_id: uuid.UUID, data: MessageCreate, user: CurrentUser, db: DbSession
) -> MessageRead:
    c = _participant(db, user, conversation_id)
    now = _now()
    message = Message(conversation_id=c.id, sender_id=user.id, body=data.body, created_at=now)
    db.add(message)
    c.last_message_at = now
    if _is_customer_side(user, c):
        c.customer_last_read_at = now
        recipient = c.tailor_id
    else:
        c.tailor_last_read_at = now
        recipient = c.customer_id
    notify_message(db, recipient, c.id, user.full_name)
    db.commit()
    return MessageRead(id=message.id, sender_id=user.id, body=message.body,
                       created_at=message.created_at, is_mine=True)


@router.post("/conversations/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_read(conversation_id: uuid.UUID, user: CurrentUser, db: DbSession) -> None:
    c = _participant(db, user, conversation_id)
    now = _now()
    if _is_customer_side(user, c):
        c.customer_last_read_at = now
    else:
        c.tailor_last_read_at = now
    db.execute(update(Notification).where(
        Notification.user_id == user.id, Notification.link == f"/messages/{c.id}",
        Notification.read_at.is_(None)).values(read_at=now))
    db.commit()


# --- Notifications -----------------------------------------------------------------------------


@router.get("/notifications", response_model=Page[NotificationRead], tags=["notifications"])
def list_notifications(
    user: CurrentUser, db: DbSession, params: Annotated[PageParams, Depends()],
    unread_only: bool = False,
) -> Page[NotificationRead]:
    stmt = select(Notification).where(Notification.user_id == user.id)
    if unread_only:
        stmt = stmt.where(Notification.read_at.is_(None))
    rows, meta = paginate(
        db, stmt.order_by(Notification.created_at.desc(), Notification.id.desc()), params
    )
    return Page[NotificationRead](
        items=[NotificationRead.model_validate(n, from_attributes=True) for n in rows], **meta
    )


@router.get("/notifications/unread-count", tags=["notifications"])
def notifications_unread(user: CurrentUser, db: DbSession) -> dict[str, int]:
    count = db.scalar(select(func.count()).where(
        Notification.user_id == user.id, Notification.read_at.is_(None)))
    return {"unread": count or 0}


@router.patch("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT,
              tags=["notifications"])
def read_all(user: CurrentUser, db: DbSession) -> None:
    db.execute(update(Notification).where(
        Notification.user_id == user.id, Notification.read_at.is_(None)).values(read_at=_now()))
    db.commit()


@router.patch("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT,
              tags=["notifications"])
def read_one(notification_id: uuid.UUID, user: CurrentUser, db: DbSession) -> None:
    n = db.get(Notification, notification_id)
    if n is None or n.user_id != user.id:
        raise NotFound("Notification not found")
    n.read_at = n.read_at or _now()
    db.commit()

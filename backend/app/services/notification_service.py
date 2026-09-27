"""In-app notifications. Email/SMS delivery will hook in here (see README)."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Notification


def notify(
    db: Session, user_id: uuid.UUID, type_: str, data: dict, link: str | None = None
) -> Notification:
    """Adds to the session; the caller's commit persists it with the triggering change."""
    notification = Notification(
        user_id=user_id, type=type_, data=data, link=link, created_at=datetime.now(UTC)
    )
    db.add(notification)
    return notification


def notify_message(
    db: Session, user_id: uuid.UUID, conversation_id: uuid.UUID, sender_name: str
) -> None:
    """One unread 'new message' notification per conversation, not one per message."""
    link = f"/messages/{conversation_id}"
    existing = db.scalar(
        select(Notification.id).where(
            Notification.user_id == user_id,
            Notification.type == "message",
            Notification.link == link,
            Notification.read_at.is_(None),
        )
    )
    if existing is None:
        notify(db, user_id, "message", {"sender": sender_name}, link)

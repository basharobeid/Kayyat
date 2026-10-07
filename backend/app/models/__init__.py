"""Importing this package registers every model on Base.metadata (Alembic relies on it)."""

from app.models.address import Address
from app.models.booking import Booking, BookingEvent, SupportMessage
from app.models.catalog import AuditLog, PortfolioItem, Service, ServiceCategory, TailorService
from app.models.enums import OrderStatus, QuoteStatus, RequestStatus, RoleName
from app.models.marketplace import (
    Conversation,
    JobRequest,
    Message,
    Notification,
    Order,
    OrderEvent,
    Quote,
    Review,
)
from app.models.profile import CustomerProfile, TailorProfile
from app.models.user import RefreshToken, Role, User, user_roles

__all__ = [
    "Address",
    "AuditLog",
    "Booking",
    "BookingEvent",
    "SupportMessage",
    "Conversation",
    "CustomerProfile",
    "JobRequest",
    "Message",
    "Notification",
    "Order",
    "OrderEvent",
    "OrderStatus",
    "PortfolioItem",
    "Quote",
    "QuoteStatus",
    "RefreshToken",
    "RequestStatus",
    "Review",
    "Role",
    "RoleName",
    "Service",
    "ServiceCategory",
    "TailorProfile",
    "TailorService",
    "User",
    "user_roles",
]

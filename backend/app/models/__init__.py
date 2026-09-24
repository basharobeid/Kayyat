"""Importing this package registers every model on Base.metadata (Alembic relies on it)."""

from app.models.address import Address
from app.models.enums import RoleName
from app.models.profile import CustomerProfile, TailorProfile
from app.models.user import RefreshToken, Role, User, user_roles

__all__ = [
    "Address",
    "CustomerProfile",
    "RefreshToken",
    "Role",
    "RoleName",
    "TailorProfile",
    "User",
    "user_roles",
]

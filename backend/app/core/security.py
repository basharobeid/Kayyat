import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import settings

TokenType = Literal["access", "refresh"]

_hasher = PasswordHasher()  # Argon2id with library-recommended parameters
# Verified against when the user does not exist, so login timing doesn't leak which accounts exist.
_DUMMY_HASH = _hasher.hash("khayyat-dummy-password")


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password_hash: str | None, password: str) -> bool:
    """Pass password_hash=None for unknown users; still spends the hashing time."""
    try:
        _hasher.verify(password_hash or _DUMMY_HASH, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False
    return password_hash is not None


def password_needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


class TokenError(Exception):
    pass


def _encode(claims: dict[str, Any]) -> str:
    return jwt.encode(claims, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: uuid.UUID, roles: list[str]) -> tuple[str, int]:
    """Returns (token, lifetime in seconds)."""
    lifetime = timedelta(minutes=settings.jwt_access_expires_minutes)
    now = datetime.now(UTC)
    token = _encode(
        {
            "sub": str(user_id),
            "type": "access",
            "roles": roles,
            "iat": now,
            "exp": now + lifetime,
            "jti": uuid.uuid4().hex,
        }
    )
    return token, int(lifetime.total_seconds())


def create_refresh_token(user_id: uuid.UUID, jti: uuid.UUID, expires_at: datetime) -> str:
    return _encode(
        {
            "sub": str(user_id),
            "type": "refresh",
            "iat": datetime.now(UTC),
            "exp": expires_at,
            "jti": str(jti),
        }
    )


def decode_token(token: str, expected_type: TokenType) -> dict[str, Any]:
    try:
        claims = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["sub", "exp", "jti", "type"]},
        )
    except jwt.PyJWTError as exc:
        raise TokenError(str(exc)) from exc
    if claims.get("type") != expected_type:
        raise TokenError("Wrong token type")
    return claims

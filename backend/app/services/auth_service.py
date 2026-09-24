import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import Conflict, Unauthorized
from app.core.security import (
    TokenError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    password_needs_rehash,
    verify_password,
)
from app.models import CustomerProfile, RefreshToken, Role, RoleName, TailorProfile, User
from app.schemas.auth import RegisterRequest, TokenPair, normalize_phone


def ensure_roles(db: Session) -> None:
    existing = set(db.scalars(select(Role.name)))
    for name in RoleName:
        if name not in existing:
            db.add(Role(name=name))
    db.flush()


def get_role(db: Session, name: RoleName) -> Role:
    role = db.scalar(select(Role).where(Role.name == name))
    if role is None:  # roles are inserted by the initial migration
        raise RuntimeError(f"Role {name!r} missing; run `alembic upgrade head`")
    return role


def create_user(
    db: Session,
    *,
    full_name: str,
    password: str,
    roles: list[RoleName],
    email: str | None = None,
    phone: str | None = None,
    **fields,
) -> User:
    clauses = []
    if email:
        clauses.append(User.email == email)
    if phone:
        clauses.append(User.phone == phone)
    if clauses and db.scalar(select(User.id).where(or_(*clauses))):
        raise Conflict("An account with this email or phone already exists")

    user = User(
        full_name=full_name,
        email=email,
        phone=phone,
        password_hash=hash_password(password),
        roles=[get_role(db, r) for r in roles],
        **fields,
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError as exc:  # lost a race with a concurrent signup
        db.rollback()
        raise Conflict("An account with this email or phone already exists") from exc

    if RoleName.CUSTOMER in roles:
        db.add(CustomerProfile(user_id=user.id))
    if RoleName.TAILOR in roles:
        db.add(TailorProfile(user_id=user.id, business_name=full_name))
    db.flush()
    return user


def register(db: Session, data: RegisterRequest) -> User:
    user = create_user(
        db,
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password=data.password,
        roles=[RoleName(data.role)],
        locale=data.locale,
    )
    db.commit()
    return user


def _find_by_identifier(db: Session, identifier: str) -> User | None:
    identifier = identifier.strip()
    if "@" in identifier:
        return db.scalar(select(User).where(User.email == identifier.lower()))
    try:
        phone = normalize_phone(identifier)
    except ValueError:
        return None
    return db.scalar(select(User).where(User.phone == phone))


def authenticate(db: Session, identifier: str, password: str) -> User:
    user = _find_by_identifier(db, identifier)
    if not verify_password(user.password_hash if user else None, password):
        raise Unauthorized("Invalid credentials")
    if not user.is_active:
        raise Unauthorized("This account is disabled")

    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
    user.last_login_at = datetime.now(UTC)
    db.commit()
    return user


def issue_tokens(db: Session, user: User, family_id: uuid.UUID | None = None) -> TokenPair:
    now = datetime.now(UTC)
    record = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        family_id=family_id or uuid.uuid4(),
        issued_at=now,
        expires_at=now + timedelta(days=settings.jwt_refresh_expires_days),
    )
    db.add(record)
    db.commit()

    access, expires_in = create_access_token(user.id, user.role_names)
    refresh = create_refresh_token(user.id, record.id, record.expires_at)
    return TokenPair(access_token=access, refresh_token=refresh, expires_in=expires_in)


def _load_refresh(db: Session, token: str) -> RefreshToken:
    try:
        claims = decode_token(token, "refresh")
        jti = uuid.UUID(claims["jti"])
    except (TokenError, ValueError) as exc:
        raise Unauthorized("Invalid refresh token") from exc
    record = db.get(RefreshToken, jti)
    if record is None:
        raise Unauthorized("Invalid refresh token")
    return record


def rotate_refresh_token(db: Session, token: str) -> TokenPair:
    record = _load_refresh(db, token)

    # Conditional update so two concurrent refreshes can't both succeed with one token.
    claimed = db.execute(
        update(RefreshToken)
        .where(RefreshToken.id == record.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    ).rowcount
    if not claimed:
        # A rotated token was replayed: assume theft and kill the whole login session.
        revoke_family(db, record.family_id)
        db.commit()
        raise Unauthorized("Refresh token has been revoked")

    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        db.rollback()
        raise Unauthorized("Invalid refresh token")

    return issue_tokens(db, user, family_id=record.family_id)


def revoke_family(db: Session, family_id: uuid.UUID) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )


def logout(db: Session, token: str) -> None:
    """Idempotent: an already-invalid token is not an error."""
    try:
        record = _load_refresh(db, token)
    except Unauthorized:
        return
    revoke_family(db, record.family_id)
    db.commit()


def logout_all(db: Session, user: User) -> None:
    db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    db.commit()

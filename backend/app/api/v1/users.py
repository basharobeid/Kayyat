import uuid

from fastapi import APIRouter, status
from sqlalchemy import select, update

from app.api.deps import CurrentUser, DbSession
from app.core.exceptions import NotFound
from app.models import Address, User
from app.schemas.user import AddressCreate, AddressRead, AddressUpdate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser) -> UserRead:
    return UserRead.from_user(user)


@router.patch("/me", response_model=UserRead)
def update_me(data: UserUpdate, user: CurrentUser, db: DbSession) -> UserRead:
    for field, value in data.model_dump(exclude_unset=True, exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    return UserRead.from_user(user)


# --- Addresses -------------------------------------------------------------------------


def _get_own_address(db: DbSession, user: User, address_id: uuid.UUID) -> Address:
    address = db.get(Address, address_id)
    # 404 (not 403) for other users' addresses so IDs can't be probed.
    if address is None or address.user_id != user.id:
        raise NotFound("Address not found")
    return address


def _clear_default(db: DbSession, user: User) -> None:
    db.execute(
        update(Address).where(Address.user_id == user.id, Address.is_default.is_(True))
        .values(is_default=False)
    )


@router.get("/me/addresses", response_model=list[AddressRead])
def list_addresses(user: CurrentUser, db: DbSession) -> list[Address]:
    return list(db.scalars(
        select(Address).where(Address.user_id == user.id)
        .order_by(Address.is_default.desc(), Address.created_at)
    ))


@router.post("/me/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED)
def create_address(data: AddressCreate, user: CurrentUser, db: DbSession) -> Address:
    has_any = db.scalar(select(Address.id).where(Address.user_id == user.id).limit(1))
    if data.is_default:
        _clear_default(db, user)
    address = Address(user_id=user.id, **data.model_dump())
    address.is_default = data.is_default or not has_any  # first address becomes default
    db.add(address)
    db.commit()
    return address


@router.patch("/me/addresses/{address_id}", response_model=AddressRead)
def update_address(
    address_id: uuid.UUID, data: AddressUpdate, user: CurrentUser, db: DbSession
) -> Address:
    address = _get_own_address(db, user, address_id)
    changes = data.model_dump(exclude_unset=True)
    if changes.get("is_default"):
        _clear_default(db, user)
    for field, value in changes.items():
        if value is None and field in {"label", "line1", "city", "is_default"}:
            continue  # required columns can't be nulled out
        setattr(address, field, value)
    db.commit()
    return address


@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: uuid.UUID, user: CurrentUser, db: DbSession) -> None:
    address = _get_own_address(db, user, address_id)
    was_default = address.is_default
    db.delete(address)
    db.flush()
    if was_default:
        replacement = db.scalar(
            select(Address).where(Address.user_id == user.id).order_by(Address.created_at).limit(1)
        )
        if replacement:
            replacement.is_default = True
    db.commit()

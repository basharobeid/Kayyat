from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenPair
from app.schemas.user import UserRead
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenPair, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: DbSession) -> TokenPair:
    user = auth_service.register(db, data)
    return auth_service.issue_tokens(db, user)


@router.post("/login", response_model=TokenPair)
def login(data: LoginRequest, db: DbSession) -> TokenPair:
    user = auth_service.authenticate(db, data.identifier, data.password)
    return auth_service.issue_tokens(db, user)


@router.post("/refresh", response_model=TokenPair)
def refresh(data: RefreshRequest, db: DbSession) -> TokenPair:
    return auth_service.rotate_refresh_token(db, data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(data: RefreshRequest, db: DbSession) -> None:
    auth_service.logout(db, data.refresh_token)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
def logout_all(user: CurrentUser, db: DbSession) -> None:
    auth_service.logout_all(db, user)


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> UserRead:
    return UserRead.from_user(user)

import uuid
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import Forbidden, Unauthorized
from app.core.security import TokenError, decode_token
from app.models import RoleName, User

DbSession = Annotated[Session, Depends(get_db)]

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> User:
    if credentials is None:
        raise Unauthorized()
    try:
        claims = decode_token(credentials.credentials, "access")
        user_id = uuid.UUID(claims["sub"])
    except (TokenError, ValueError) as exc:
        raise Unauthorized("Invalid or expired access token") from exc

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise Unauthorized("Invalid or expired access token")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*roles: RoleName):
    """Dependency factory: `Depends(require_roles(RoleName.ADMIN))`.

    Roles are read from the database, not the token, so revoking a role takes effect
    immediately instead of when the access token expires.
    """

    def _check(user: CurrentUser) -> User:
        if not user.has_role(*roles):
            raise Forbidden()
        return user

    return _check

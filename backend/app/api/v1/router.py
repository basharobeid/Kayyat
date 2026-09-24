from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.v1 import auth, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)


@api_router.get("/health", tags=["meta"])
def health(db: DbSession) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}

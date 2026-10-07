from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import DbSession
from app.api.v1 import (
    admin,
    auth,
    bookings,
    catalog,
    messages,
    orders,
    requests,
    tailors,
    users,
)

api_router = APIRouter()
for module in (auth, users, catalog, bookings, tailors, requests, orders, messages, admin):
    api_router.include_router(module.router)


@api_router.get("/health", tags=["meta"])
def health(db: DbSession) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}

import math
import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import Query
from pydantic import BaseModel, PlainSerializer
from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

# Decimals go over the wire as JSON numbers (pydantic's default is a string).
Money = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]


class Page[T](BaseModel):
    items: list[T]
    total: int
    page: int
    per_page: int
    pages: int


class PageParams:
    def __init__(
        self,
        page: Annotated[int, Query(ge=1)] = 1,
        per_page: Annotated[int, Query(ge=1, le=50)] = 20,
    ):
        self.page = page
        self.per_page = per_page


def paginate(db: Session, stmt: Select, params: PageParams, *, scalars: bool = True):
    """Returns (rows, meta dict). `meta` spreads straight into Page(...)."""
    total = db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    paged = stmt.limit(params.per_page).offset((params.page - 1) * params.per_page)
    rows = list(db.scalars(paged).unique()) if scalars else list(db.execute(paged).unique())
    meta = {
        "total": total,
        "page": params.page,
        "per_page": params.per_page,
        "pages": max(1, math.ceil(total / params.per_page)),
    }
    return rows, meta


class UserBrief(BaseModel):
    id: uuid.UUID
    name: str
    avatar_url: str | None = None


def first_name(full_name: str) -> str:
    """What the other side of a not-yet-accepted deal may see (blueprint 12.2)."""
    return full_name.split()[0] if full_name.strip() else full_name

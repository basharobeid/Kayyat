from fastapi import APIRouter, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.core.constants import CITIES, SPECIALTIES
from app.core.storage import store_image
from app.models import ServiceCategory
from app.schemas.catalog import CategoryRead, ServiceRead

router = APIRouter(tags=["catalog"])


def categories_with_services(db: DbSession, *, include_inactive: bool) -> list[CategoryRead]:
    categories = db.scalars(
        select(ServiceCategory)
        .options(selectinload(ServiceCategory.services))
        .order_by(ServiceCategory.sort_order)
    ).unique()
    return [
        CategoryRead(
            id=c.id, slug=c.slug, name_ar=c.name_ar, name_en=c.name_en,
            services=[ServiceRead.of(s) for s in c.services if include_inactive or s.is_active],
        )
        for c in categories
    ]


@router.get("/services", response_model=list[CategoryRead])
def list_services(db: DbSession) -> list[CategoryRead]:
    return categories_with_services(db, include_inactive=False)


@router.get("/meta")
def meta() -> dict:
    """Vocabularies the UI needs to build filters and forms."""
    return {
        "cities": list(CITIES),
        "specialties": list(SPECIALTIES),
        "currency": settings.currency,
        "commission_rate": float(settings.platform_commission_rate),
    }


@router.post("/media/images", status_code=201)
async def upload_image(file: UploadFile, user: CurrentUser) -> dict[str, str]:
    # Read one byte past the limit so oversize files fail without buffering everything.
    data = await file.read(settings.max_upload_bytes + 1)
    return {"url": store_image(data)}

from pydantic import BaseModel, ConfigDict, Field

from app.models import Service


class ServiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name_ar: str
    name_en: str
    category_slug: str
    is_active: bool = True

    @classmethod
    def of(cls, service: Service) -> "ServiceRead":
        return cls(
            id=service.id,
            slug=service.slug,
            name_ar=service.name_ar,
            name_en=service.name_en,
            category_slug=service.category.slug,
            is_active=service.is_active,
        )


class CategoryRead(BaseModel):
    id: int
    slug: str
    name_ar: str
    name_en: str
    services: list[ServiceRead]


class ServiceCreate(BaseModel):
    category_id: int
    slug: str = Field(pattern=r"^[a-z0-9_]{2,60}$")
    name_ar: str = Field(min_length=2, max_length=80)
    name_en: str = Field(min_length=2, max_length=80)
    sort_order: int = 0


class ServiceUpdate(BaseModel):
    name_ar: str | None = Field(default=None, min_length=2, max_length=80)
    name_en: str | None = Field(default=None, min_length=2, max_length=80)
    is_active: bool | None = None
    sort_order: int | None = None

"""Seed local demo data. Idempotent; refuses to run in production.

    cd backend && python -m scripts.seed
"""

from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.models import RoleName, TailorProfile, User
from app.models.enums import VerificationLevel
from app.services.auth_service import create_user, ensure_roles

DEMO_PASSWORD = "demo1234"

DEMO_ACCOUNTS = [
    ("sara@demo.khayyat", "سارة العتيبي", [RoleName.CUSTOMER]),
    ("ahmad@demo.khayyat", "أبو أحمد", [RoleName.TAILOR]),
    ("mohammed@demo.khayyat", "محمد القماش", [RoleName.SELLER]),
    ("yousef@demo.khayyat", "يوسف السالم", [RoleName.DELIVERY]),
    ("admin@demo.khayyat", "نورة (مشرفة)", [RoleName.ADMIN]),
]

# (email, name, business, city slug, lat, lng, specialties, years, pickup, delivery)
# Ratings are left at zero: they must come from real reviews, never seeded.
DEMO_TAILORS = [
    ("ahmad@demo.khayyat", "أبو أحمد", "خياطة أبو أحمد", "damascus", 33.5138, 36.2765,
     ["alterations", "thobes", "suits"], 25, True, True),
    ("khaled@demo.khayyat", "خالد الحلبي", "مشغل الأناقة", "damascus", 33.5011, 36.249,
     ["thobes", "bisht"], 18, True, False),
    ("fatima@demo.khayyat", "فاطمة الشامي", "دار فاطمة للأزياء", "damascus", 33.5215, 36.2961,
     ["evening_dresses", "wedding_dresses", "alterations"], 12, False, True),
    ("omar@demo.khayyat", "عمر القباني", "خياط الحي", "damascus", 33.495, 36.302,
     ["alterations", "repairs"], 9, True, True),
    ("layla@demo.khayyat", "ليلى الحمصي", "لمسة ليلى", "homs", 34.7324, 36.7137,
     ["abayas", "evening_dresses"], 7, False, False),
    ("hassan@demo.khayyat", "حسن العطار", "بدلات حسن", "damascus", 33.5302, 36.28,
     ["suits", "alterations"], 30, True, True),
    ("maryam@demo.khayyat", "مريم الحموي", "مشغل مريم", "hama", 35.1318, 36.7578,
     ["abayas", "kids", "repairs"], 5, True, False),
    ("saeed@demo.khayyat", "سعيد الحلبي", "الإبرة الذهبية", "aleppo", 36.2021, 37.1343,
     ["thobes", "ihram", "alterations"], 15, False, True),
    ("huda@demo.khayyat", "هدى اللاذقاني", "أزياء هدى", "latakia", 35.5317, 35.79,
     ["wedding_dresses", "embroidery"], 11, False, False),
    ("ibrahim@demo.khayyat", "إبراهيم الدرعاوي", "ورشة إبراهيم", "damascus", 33.51, 36.312,
     ["uniforms", "suits", "alterations"], 20, True, True),
]


def _get_or_create(db, email: str, name: str, roles: list[RoleName]) -> User:
    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = create_user(db, full_name=name, email=email, password=DEMO_PASSWORD, roles=roles)
        print(f"  + {email}")
    return user


def main() -> None:
    if settings.environment == "production":
        raise SystemExit("Refusing to seed demo accounts in production.")

    with SessionLocal() as db:
        ensure_roles(db)
        print("Demo accounts:")
        for email, name, roles in DEMO_ACCOUNTS:
            _get_or_create(db, email, name, roles)

        print("Demo tailors:")
        for (email, name, business, city, lat, lng, specialties, years, pickup,
             delivery) in DEMO_TAILORS:
            user = _get_or_create(db, email, name, [RoleName.TAILOR])
            profile = db.get(TailorProfile, user.id)
            profile.business_name = business
            profile.city = city
            profile.latitude, profile.longitude = lat, lng
            profile.specialties = specialties
            profile.years_experience = years
            profile.offers_pickup, profile.offers_delivery = pickup, delivery
            profile.verification_level = (
                VerificationLevel.PROFESSIONAL if years >= 15 else VerificationLevel.IDENTITY
            )

        db.commit()
    print(f"Done. All demo accounts use the password {DEMO_PASSWORD!r} (local dev only).")


if __name__ == "__main__":
    main()

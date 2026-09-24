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
    ("ahmad@demo.khayyat", "أبو أحمد", "خياطة أبو أحمد", "riyadh", 24.7136, 46.6753,
     ["alterations", "thobes", "suits"], 25, True, True),
    ("khaled@demo.khayyat", "خالد المطيري", "مشغل الأناقة", "riyadh", 24.7743, 46.7386,
     ["thobes", "bisht"], 18, True, False),
    ("fatima@demo.khayyat", "فاطمة الزهراني", "دار فاطمة للأزياء", "jeddah", 21.5433, 39.1728,
     ["evening_dresses", "wedding_dresses", "alterations"], 12, False, True),
    ("omar@demo.khayyat", "عمر الحربي", "خياط الحي", "jeddah", 21.4858, 39.1925,
     ["alterations", "repairs"], 9, True, True),
    ("layla@demo.khayyat", "ليلى القحطاني", "لمسة ليلى", "dammam", 26.4207, 50.0888,
     ["abayas", "evening_dresses"], 7, False, False),
    ("hassan@demo.khayyat", "حسن الشمري", "بدلات حسن", "riyadh", 24.6877, 46.7219,
     ["suits", "alterations"], 30, True, True),
    ("maryam@demo.khayyat", "مريم الدوسري", "مشغل مريم", "khobar", 26.2172, 50.1971,
     ["abayas", "kids", "repairs"], 5, True, False),
    ("saeed@demo.khayyat", "سعيد الغامدي", "الإبرة الذهبية", "makkah", 21.3891, 39.8579,
     ["thobes", "ihram", "alterations"], 15, False, True),
    ("huda@demo.khayyat", "هدى العنزي", "أزياء هدى", "madinah", 24.5247, 39.5692,
     ["wedding_dresses", "embroidery"], 11, False, False),
    ("ibrahim@demo.khayyat", "إبراهيم الزهراني", "ورشة إبراهيم", "dammam", 26.3927, 49.9777,
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

"""Fixed vocabularies shared with the frontend (frontend/src/messages/*.json holds the labels).

Slugs are stored in the database; display names live in translations only.
"""

# Syrian governorates. Bookings are only accepted in settings.service_cities.
CITIES = (
    "damascus",
    "rif_dimashq",
    "aleppo",
    "homs",
    "hama",
    "latakia",
    "tartus",
    "daraa",
    "as_suwayda",
    "quneitra",
    "idlib",
    "deir_ez_zor",
    "raqqa",
    "hasakah",
)

SPECIALTIES = (
    "alterations",
    "repairs",
    "thobes",
    "bisht",
    "suits",
    "abayas",
    "evening_dresses",
    "wedding_dresses",
    "embroidery",
    "kids",
    "uniforms",
    "ihram",
)

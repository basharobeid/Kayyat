import os
import tempfile

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-bytes-long"
os.environ["MEDIA_DIR"] = tempfile.mkdtemp(prefix="khayyat-media-")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models  # noqa: E402, F401  (registers models)
from app.core.database import Base, get_db, make_engine  # noqa: E402
from app.main import app  # noqa: E402
from app.services.auth_service import ensure_roles  # noqa: E402


@pytest.fixture
def db_session():
    engine = make_engine("sqlite://", poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    session = Session()
    ensure_roles(session)
    session.commit()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register(client, **overrides):
    payload = {
        "full_name": "سارة أحمد",
        "email": "sara@example.com",
        "password": "correct-horse-1",
        **overrides,
    }
    return client.post("/api/v1/auth/register", json=payload)


def auth_header(tokens: dict) -> dict:
    return {"Authorization": f"Bearer {tokens['access_token']}"}


# --- Marketplace helpers -----------------------------------------------------------------------

from app.models import Service, ServiceCategory  # noqa: E402
from app.models.enums import RoleName  # noqa: E402
from app.services.auth_service import create_user  # noqa: E402


@pytest.fixture
def catalog(db_session):
    alteration = ServiceCategory(slug="alteration", name_ar="تعديل", name_en="Alteration")
    custom = ServiceCategory(slug="custom", name_ar="تفصيل", name_en="Custom", sort_order=1)
    db_session.add_all([alteration, custom])
    db_session.flush()
    hem = Service(category_id=alteration.id, slug="hem_pants", name_ar="تقصير", name_en="Hem")
    suit = Service(category_id=custom.id, slug="custom_suit", name_ar="بدلة", name_en="Suit")
    db_session.add_all([hem, suit])
    db_session.commit()
    return {"hem": hem.id, "suit": suit.id}


class Actor:
    def __init__(self, client, headers, user_id):
        self.client, self.h, self.id = client, headers, user_id

    def get(self, url, **kw):
        return self.client.get(url, headers=self.h, **kw)

    def post(self, url, json=None, **kw):
        return self.client.post(url, json=json, headers=self.h, **kw)

    def patch(self, url, json=None):
        return self.client.patch(url, json=json, headers=self.h)

    def put(self, url, json=None):
        return self.client.put(url, json=json, headers=self.h)

    def delete(self, url):
        return self.client.delete(url, headers=self.h)


@pytest.fixture
def make_actor(client, db_session):
    counter = iter(range(1000))

    def _make(role: str = "customer", name: str | None = None) -> Actor:
        n = next(counter)
        email = f"{role}{n}@example.com"
        full_name = name or f"{role.title()} Person{n}"
        if role == "admin":
            create_user(db_session, full_name=full_name, email=email, password="pass-12345",
                        roles=[RoleName.ADMIN])
            db_session.commit()
            tokens = client.post("/api/v1/auth/login",
                                 json={"identifier": email, "password": "pass-12345"}).json()
        else:
            tokens = client.post("/api/v1/auth/register", json={
                "full_name": full_name, "email": email, "password": "pass-12345", "role": role,
            }).json()
        headers = auth_header(tokens)
        me = client.get("/api/v1/auth/me", headers=headers).json()
        return Actor(client, headers, me["id"])

    return _make

import os

os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET"] = "test-secret-that-is-at-least-32-bytes-long"

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

import uuid

from fastapi import Depends

from app.api.deps import require_roles
from app.main import app
from app.models import RoleName, TailorProfile
from tests.conftest import auth_header, register


def test_register_returns_tokens_and_creates_profile(client, db_session):
    res = register(client, role="tailor")
    assert res.status_code == 201
    tokens = res.json()
    assert tokens["token_type"] == "bearer"

    me = client.get("/api/v1/auth/me", headers=auth_header(tokens)).json()
    assert me["roles"] == ["tailor"]
    assert me["locale"] == "ar"
    assert db_session.get(TailorProfile, uuid.UUID(me["id"])) is not None


def test_register_requires_email_or_phone(client):
    res = register(client, email=None)
    assert res.status_code == 422
    assert res.headers["content-type"] == "application/problem+json"
    assert res.json()["title"] == "Validation Error"


def test_register_rejects_admin_role(client):
    assert register(client, role="admin").status_code == 422


def test_duplicate_email_conflicts(client):
    register(client)
    res = register(client, email="SARA@example.com")
    assert res.status_code == 409


def test_login_with_email_and_phone(client):
    register(client, phone="+966 50 123 4567")
    for identifier in ("Sara@Example.com", "+966501234567"):
        res = client.post(
            "/api/v1/auth/login", json={"identifier": identifier, "password": "correct-horse-1"}
        )
        assert res.status_code == 200, identifier


def test_login_wrong_password(client):
    register(client)
    res = client.post(
        "/api/v1/auth/login", json={"identifier": "sara@example.com", "password": "nope"}
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"


def test_login_unknown_user_gives_same_error(client):
    res = client.post(
        "/api/v1/auth/login", json={"identifier": "ghost@example.com", "password": "nope"}
    )
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid credentials"


def test_me_requires_token(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
    assert res.json()["type"].endswith("/unauthorized")


def test_refresh_token_cannot_be_used_as_access_token(client):
    tokens = register(client).json()
    res = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['refresh_token']}"}
    )
    assert res.status_code == 401


def test_refresh_rotates_and_detects_reuse(client):
    first = register(client).json()

    second = client.post("/api/v1/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert second.status_code == 200
    second = second.json()
    assert second["refresh_token"] != first["refresh_token"]

    # Replaying the rotated token fails and revokes the whole family...
    replay = client.post("/api/v1/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert replay.status_code == 401
    # ...including the legitimately issued newer token.
    res = client.post("/api/v1/auth/refresh", json={"refresh_token": second["refresh_token"]})
    assert res.status_code == 401


def test_logout_revokes_refresh_token(client):
    tokens = register(client).json()
    assert client.post(
        "/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]}
    ).status_code == 204
    res = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert res.status_code == 401


def test_logout_all_revokes_every_session(client):
    first = register(client).json()
    second = client.post(
        "/api/v1/auth/login",
        json={"identifier": "sara@example.com", "password": "correct-horse-1"},
    ).json()
    client.post("/api/v1/auth/logout-all", headers=auth_header(second))
    for tokens in (first, second):
        res = client.post("/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
        assert res.status_code == 401


def test_require_roles(client):
    @app.get("/_test/admin-only", dependencies=[Depends(require_roles(RoleName.ADMIN))])
    def _admin_only():
        return {"ok": True}

    try:
        tokens = register(client).json()
        assert client.get("/_test/admin-only", headers=auth_header(tokens)).status_code == 403
    finally:
        app.router.routes.pop()

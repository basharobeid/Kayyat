from tests.conftest import auth_header, register

ADDRESS = {"label": "المنزل", "line1": "شارع الملك فهد", "city": "الرياض"}


def test_health(client):
    assert client.get("/api/v1/health").json() == {"status": "ok", "database": "ok"}


def test_update_profile(client):
    h = auth_header(register(client).json())
    res = client.patch("/api/v1/users/me", json={"full_name": "Sara A.", "locale": "en"}, headers=h)
    assert res.status_code == 200
    assert res.json()["full_name"] == "Sara A."
    assert res.json()["locale"] == "en"


def test_first_address_becomes_default_and_default_is_unique(client):
    h = auth_header(register(client).json())
    first = client.post("/api/v1/users/me/addresses", json=ADDRESS, headers=h).json()
    assert first["is_default"] is True

    second = client.post(
        "/api/v1/users/me/addresses", json={**ADDRESS, "label": "العمل", "is_default": True},
        headers=h,
    ).json()
    listed = client.get("/api/v1/users/me/addresses", headers=h).json()
    assert [a["id"] for a in listed if a["is_default"]] == [second["id"]]


def test_deleting_default_promotes_another(client):
    h = auth_header(register(client).json())
    first = client.post("/api/v1/users/me/addresses", json=ADDRESS, headers=h).json()
    second = client.post(
        "/api/v1/users/me/addresses", json={**ADDRESS, "label": "العمل"}, headers=h
    ).json()
    assert client.delete(f"/api/v1/users/me/addresses/{first['id']}", headers=h).status_code == 204
    listed = client.get("/api/v1/users/me/addresses", headers=h).json()
    assert listed == [{**second, "is_default": True}]


def test_cannot_touch_other_users_address(client):
    owner = auth_header(register(client).json())
    other = auth_header(register(client, email="other@example.com").json())
    addr = client.post("/api/v1/users/me/addresses", json=ADDRESS, headers=owner).json()

    url = f"/api/v1/users/me/addresses/{addr['id']}"
    assert client.patch(url, json={"label": "x"}, headers=other).status_code == 404
    assert client.delete(url, headers=other).status_code == 404

import io

from tests.test_marketplace import QUOTE, REQUEST

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


def test_tailor_profile_services_and_search(make_actor, catalog, client):
    a = make_actor("tailor", "أبو أحمد")
    b = make_actor("tailor", "Khaled")
    a.patch("/api/v1/tailors/me/profile", {"business_name": "خياطة أبو أحمد", "city": "damascus",
                                           "specialties": ["thobes", "suits"],
                                           "offers_delivery": True, "years_experience": 25})
    b.patch("/api/v1/tailors/me/profile", {"city": "aleppo", "specialties": ["abayas"]})
    res = a.put("/api/v1/tailors/me/services", {"items": [
        {"service_id": catalog["hem"], "price_from": 30, "duration_days": 2},
        {"service_id": catalog["suit"], "price_from": 900},
    ]})
    assert res.status_code == 200 and len(res.json()["services"]) == 2
    b.put("/api/v1/tailors/me/services", {"items": [{"service_id": catalog["hem"],
                                                     "price_from": 20}]})

    def search(**params):
        return client.get("/api/v1/tailors", params=params).json()

    assert search()["total"] == 2
    assert [t["city"] for t in search(city="damascus")["items"]] == ["damascus"]
    assert search(specialty="abayas")["items"][0]["city"] == "aleppo"
    assert search(q="أبو")["total"] == 1
    assert search(delivery="true")["total"] == 1
    assert search(service="custom_suit")["items"][0]["price_from"] == 900
    assert [t["price_from"] for t in search(service="hem_pants", sort="price")["items"]] == [20, 30]
    assert search(city="atlantis")["total"] == 0
    assert search(q="100%_")["total"] == 0  # LIKE wildcards are escaped

    bad = a.patch("/api/v1/tailors/me/profile", {"specialties": ["juggling"]})
    assert bad.status_code == 422


def test_customers_cannot_use_tailor_endpoints(make_actor):
    customer = make_actor("customer")
    assert customer.get("/api/v1/tailors/me/profile").status_code == 403


def test_media_upload_and_portfolio(make_actor):
    tailor = make_actor("tailor")
    up = tailor.client.post("/api/v1/media/images", headers=tailor.h,
                            files={"file": ("x.png", io.BytesIO(PNG), "image/png")})
    assert up.status_code == 201, up.text
    url = up.json()["url"]
    assert url.startswith("http://localhost:8000/media/") and url.endswith(".png")

    fake = tailor.client.post("/api/v1/media/images", headers=tailor.h,
                              files={"file": ("x.png", io.BytesIO(b"<svg/>"), "image/png")})
    assert fake.status_code == 415  # content sniffed, not trusted from the filename

    item = tailor.post("/api/v1/tailors/me/portfolio", {"image_url": url, "title": "ثوب"})
    assert item.status_code == 201
    assert len(tailor.get("/api/v1/tailors/me/profile").json()["portfolio"]) == 1
    assert tailor.delete(f"/api/v1/tailors/me/portfolio/{item.json()['id']}").status_code == 204
    assert tailor.post("/api/v1/tailors/me/portfolio",
                       {"image_url": "https://elsewhere/x.png", "title": "x"}).status_code == 422


def test_messaging_and_unread(make_actor, catalog):
    customer = make_actor("customer")
    tailor = make_actor("tailor")
    request = customer.post("/api/v1/requests", REQUEST).json()
    tailor.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE)

    convs = tailor.get("/api/v1/conversations").json()["items"]
    assert len(convs) == 1 and convs[0]["request_title"] == REQUEST["title"]
    cid = convs[0]["id"]

    tailor.post(f"/api/v1/conversations/{cid}/messages", {"body": "مرحبا"})
    tailor.post(f"/api/v1/conversations/{cid}/messages", {"body": "متى يناسبك الاستلام؟"})
    assert customer.get("/api/v1/conversations/unread-count").json() == {"unread": 2}
    # Two messages, but only one unread 'message' notification.
    notes = customer.get("/api/v1/notifications?unread_only=true").json()["items"]
    assert [n["type"] for n in notes].count("message") == 1

    msgs = customer.get(f"/api/v1/conversations/{cid}/messages").json()
    assert [m["body"] for m in msgs] == ["مرحبا", "متى يناسبك الاستلام؟"]
    assert not msgs[0]["is_mine"]
    newer = customer.get(f"/api/v1/conversations/{cid}/messages",
                         params={"after": msgs[0]["created_at"]}).json()
    assert [m["body"] for m in newer] == ["متى يناسبك الاستلام؟"]

    customer.post(f"/api/v1/conversations/{cid}/read")
    assert customer.get("/api/v1/conversations/unread-count").json() == {"unread": 0}
    assert customer.get("/api/v1/notifications/unread-count").json()["unread"] == 1  # the quote

    stranger = make_actor("customer")
    assert stranger.get(f"/api/v1/conversations/{cid}/messages").status_code == 404
    assert customer.post(f"/api/v1/conversations/{cid}/messages",
                         {"body": "   "}).status_code == 422


def test_customer_starts_direct_conversation(make_actor):
    customer = make_actor("customer")
    tailor = make_actor("tailor")
    first = customer.post("/api/v1/conversations", {"tailor_id": tailor.id}).json()
    again = customer.post("/api/v1/conversations", {"tailor_id": tailor.id}).json()
    assert first["id"] == again["id"] and first["request_id"] is None
    assert tailor.post("/api/v1/conversations", {"tailor_id": tailor.id}).status_code == 403


def test_admin(make_actor, catalog):
    admin = make_actor("admin")
    customer = make_actor("customer")
    tailor = make_actor("tailor")

    assert customer.get("/api/v1/admin/stats").status_code == 403
    stats = admin.get("/api/v1/admin/stats").json()
    assert stats["users_by_role"]["tailor"] == 1 and stats["tailors_unverified"] == 1

    users = admin.get("/api/v1/admin/users", params={"role": "tailor"}).json()
    assert [u["id"] for u in users["items"]] == [tailor.id]

    verified = admin.patch(f"/api/v1/admin/tailors/{tailor.id}/verification",
                           {"level": "professional"})
    assert verified.json()["verification_level"] == "professional"
    assert "verified" in [n["type"] for n in tailor.get("/api/v1/notifications").json()["items"]]

    assert admin.patch(f"/api/v1/admin/users/{admin.id}", {"is_active": False}).status_code == 403
    admin.patch(f"/api/v1/admin/users/{customer.id}", {"is_active": False})
    assert customer.get("/api/v1/auth/me").status_code == 401  # blocked immediately

    svc = admin.post("/api/v1/admin/services", {"category_id": 1, "slug": "bisht_repair",
                                                "name_ar": "تصليح بشت", "name_en": "Bisht repair"})
    assert svc.status_code == 201
    admin.patch(f"/api/v1/admin/services/{svc.json()['id']}", {"is_active": False})
    public = admin.get("/api/v1/services").json()
    assert "bisht_repair" not in {s["slug"] for c in public for s in c["services"]}

    actions = [e["action"] for e in admin.get("/api/v1/admin/audit-logs").json()["items"]]
    assert actions == ["service.update", "service.create", "user.deactivate",
                       "tailor.verification"]

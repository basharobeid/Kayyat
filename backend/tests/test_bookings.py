from datetime import timedelta

import pytest

from app.core.config import settings
from app.services import booking_service, google_auth


def open_day(offset: int = 1):
    day = booking_service.now_damascus().date() + timedelta(days=offset)
    while day.weekday() == booking_service.CLOSED_WEEKDAY:
        day += timedelta(days=1)
    return day.isoformat()


ADDRESS = {"district": "المزة", "address_line": "شارع الجلاء، بناء 12", "contact_phone": "0991234567"}


def book(actor, service_type="van_pickup", slot="12:00", day=None, **extra):
    payload = {
        "service_type": service_type,
        "description": "بدي قصّر بنطلون الجينز 4 سانتي",
        "scheduled_date": day or open_day(),
        "slot": slot,
        **(ADDRESS if service_type != "shop_visit" else {}),
        **extra,
    }
    return actor.post("/api/v1/bookings", payload)


def recommend(client, description, quick_items=(), prefers_home=False):
    return client.post("/api/v1/bookings/recommend", json={
        "description": description, "quick_items": list(quick_items),
        "prefers_home": prefers_home,
    }).json()["service_type"]


def test_recommendation(client):
    assert recommend(client, "الزر مقطوع بالقميص") == "quick_fix"
    assert recommend(client, "", quick_items=["zipper"]) == "quick_fix"
    # "أزرق" (blue) contains the letters of "زر" (button) but is not a repair.
    assert recommend(client, "فستان أزرق") == "shop_visit"
    assert recommend(client, "بدي قصّر أكمام الجاكيت", prefers_home=True) == "home_service"
    assert recommend(client, "تضييق خصر البنطلون", prefers_home=True) == "van_pickup"
    assert recommend(client, "تفصيل بدلة جديدة للعرس") == "shop_visit"
    assert recommend(client, "custom wedding dress", prefers_home=True) == "van_pickup"
    # A repair plus a measurement job is not a quick fix.
    assert recommend(client, "button missing and I need the waist taken in") == "shop_visit"


def test_options_and_availability(client):
    opts = client.get("/api/v1/bookings/options").json()
    assert opts["usd_to_syp"] == settings.usd_to_syp
    assert opts["quick_items_usd"]["button"] == [1.0, 2.0]
    assert opts["service_cities"] == ["damascus"]

    day = booking_service.now_damascus().date()
    while day.weekday() != booking_service.CLOSED_WEEKDAY:
        day += timedelta(days=1)
    friday = client.get("/api/v1/bookings/availability",
                        params={"service_type": "van_pickup", "date": day.isoformat()}).json()
    assert friday and not any(s["available"] for s in friday)

    shop = client.get("/api/v1/bookings/availability",
                      params={"service_type": "shop_visit", "date": open_day()}).json()
    assert [s["slot"] for s in shop][:2] == ["10:00", "11:00"]
    assert all(s["available"] for s in shop)


def test_slot_capacity_is_shared_by_van_services(make_actor):
    a, b, c = make_actor(), make_actor(), make_actor()
    assert book(a, "van_pickup").status_code == 201
    assert book(b, "home_service").status_code == 201  # same vans
    full = book(c, "quick_fix", quick_items=["button"])
    assert full.status_code == 409
    slots = c.get("/api/v1/bookings/availability",
                  params={"service_type": "van_pickup", "date": open_day()}).json()
    assert {s["slot"]: s["available"] for s in slots}["12:00"] is False
    # The shop has its own capacity.
    assert book(c, "shop_visit").status_code == 201


def test_validation(make_actor):
    sara = make_actor()
    assert book(sara, "quick_fix").status_code == 422  # no repair picked
    no_address = sara.post("/api/v1/bookings", {
        "service_type": "home_service", "description": "تقصير أكمام الثوب",
        "scheduled_date": open_day(), "slot": "10:00"})
    assert no_address.status_code == 422
    assert book(sara, city="aleppo").status_code == 422  # not served yet
    assert book(sara, slot="11:00").status_code == 422  # not a van window
    assert book(sara, day="2020-01-01").status_code in (409, 422)

    quick = book(sara, "quick_fix", quick_items=["button", "zipper"], description="")
    assert quick.status_code == 201
    body = quick.json()
    assert (body["estimate_min_usd"], body["estimate_max_usd"]) == (5.0, 10.0)
    assert body["visit_fee_usd"] == 1.0
    assert body["reference"].startswith("KH-")

    shop = book(sara, "shop_visit", slot="15:00").json()
    assert shop["district"] is None and shop["address_line"] is None


def test_van_pipeline_end_to_end(make_actor):
    sara, other, staff = make_actor(), make_actor(), make_actor("admin")
    booking = book(sara).json()
    bid = booking["id"]
    assert [s["status"] for s in booking["pipeline"]] == booking_service.PIPELINES[
        booking_service.T.VAN_PICKUP]
    assert booking["pipeline"][0]["current"] and booking["can_cancel"]

    assert other.get(f"/api/v1/bookings/{bid}").status_code == 404
    assert sara.post(f"/api/v1/staff/bookings/{bid}/advance", {}).status_code == 403
    assert staff.post(f"/api/v1/staff/bookings/{bid}/paid").status_code == 409  # not done yet

    staff.post(f"/api/v1/staff/bookings/{bid}/advance", {})  # confirmed
    staff.post(f"/api/v1/staff/bookings/{bid}/advance", {"assignee_name": "Van 2 · Abu Ahmad"})
    view = sara.get(f"/api/v1/bookings/{bid}").json()
    assert view["status"] == "van_assigned" and view["assignee_name"] == "Van 2 · Abu Ahmad"
    assert view["can_cancel"] is False
    assert sara.post(f"/api/v1/bookings/{bid}/cancel", {}).status_code == 409

    staff.post(f"/api/v1/staff/bookings/{bid}/price", {"final_price_usd": 6})
    while (r := staff.post(f"/api/v1/staff/bookings/{bid}/advance", {})).status_code == 200:
        pass
    assert r.status_code == 409  # nothing after completed
    done = sara.get(f"/api/v1/bookings/{bid}").json()
    assert done["status"] == "completed" and done["final_price_usd"] == 6.0
    assert all(step["reached_at"] for step in done["pipeline"])

    notes = sara.get("/api/v1/notifications").json()["items"]
    statuses = {n["data"].get("status") for n in notes if n["type"] == "booking_status"}
    assert {"van_assigned", "item_received", "completed"} <= statuses

    assert staff.post(f"/api/v1/staff/bookings/{bid}/paid").json()["payment_status"] == "paid"
    reviewed = sara.post(f"/api/v1/bookings/{bid}/review", {"rating": 5, "comment": "ممتاز"})
    assert reviewed.json()["rating"] == 5 and reviewed.json()["can_review"] is False
    assert sara.post(f"/api/v1/bookings/{bid}/review", {"rating": 4}).status_code == 409

    listed = staff.get("/api/v1/staff/bookings", params={"active": True}).json()
    assert bid not in [b["id"] for b in listed["items"]]


def test_customer_cancel_frees_the_slot(make_actor):
    sara, b, c = make_actor(), make_actor(), make_actor()
    first = book(sara).json()
    book(b)
    assert book(c).status_code == 409
    cancelled = sara.post(f"/api/v1/bookings/{first['id']}/cancel", {"reason": "سافرت"}).json()
    assert cancelled["status"] == "cancelled" and cancelled["next_status"] is None
    assert book(c).status_code == 201


def test_support_chat(make_actor):
    sara, staff = make_actor(name="Sara Ali"), make_actor("admin")
    bid = book(sara, "shop_visit", slot="11:00").json()["id"]
    assert sara.post("/api/v1/support/messages",
                     {"body": "قبل ما إجي، بتعدلوا فساتين حرير؟"}).status_code == 201
    sara.post("/api/v1/support/messages", {"body": "رقم الحجز معي", "booking_id": bid})

    threads = staff.get("/api/v1/staff/support").json()
    assert threads[0]["customer_name"] == "Sara Ali"
    reply = staff.post(f"/api/v1/staff/support/{sara.id}",
                       {"body": "أكيد، جيبيه معك", "booking_id": bid})
    assert reply.status_code == 201

    thread = sara.get("/api/v1/support/messages").json()
    assert [m["from_staff"] for m in thread] == [False, False, True]
    notes = sara.get("/api/v1/notifications").json()["items"]
    assert any(n["type"] == "support_reply" for n in notes)
    assert sara.get(f"/api/v1/staff/support/{sara.id}").status_code == 403


def test_google_sign_in(client, monkeypatch):
    unconfigured = client.post("/api/v1/auth/google", json={"id_token": "x" * 40})
    assert unconfigured.status_code == 503

    claims = {"email": "Bashar@Gmail.com", "email_verified": True, "name": "Bashar Obeid",
              "picture": "https://lh3.googleusercontent.com/a/photo"}
    monkeypatch.setattr(google_auth, "verify_id_token", lambda token: claims)
    monkeypatch.setattr(settings, "admin_emails", "bashar@gmail.com")

    first = client.post("/api/v1/auth/google", json={"id_token": "x" * 40}).json()
    me = client.get("/api/v1/auth/me",
                    headers={"Authorization": f"Bearer {first['access_token']}"}).json()
    assert me["email"] == "bashar@gmail.com" and me["email_verified"]
    assert set(me["roles"]) == {"customer", "admin"}

    again = client.post("/api/v1/auth/google", json={"id_token": "x" * 40}).json()
    me2 = client.get("/api/v1/auth/me",
                     headers={"Authorization": f"Bearer {again['access_token']}"}).json()
    assert me2["id"] == me["id"]  # same account, not a duplicate


@pytest.mark.parametrize("bad", [{"email_verified": False}, {"iss": "evil.example.com"}])
def test_google_token_checks(monkeypatch, bad):
    from google.oauth2 import id_token

    monkeypatch.setattr(settings, "google_client_id", "client-123.apps.googleusercontent.com")
    claims = {"iss": "accounts.google.com", "email": "a@b.com", "email_verified": True, **bad}
    monkeypatch.setattr(id_token, "verify_oauth2_token", lambda *a, **k: claims)
    from app.core.exceptions import Unauthorized

    with pytest.raises(Unauthorized):
        google_auth.verify_id_token("token")

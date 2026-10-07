"""End-to-end marketplace flow: request -> quotes -> order -> status -> review."""

import pytest

REQUEST = {
    "title": "تقصير بنطلون",
    "description": "أبغى أقصر البنطلون ٣ سم مع الحفاظ على الحافة الأصلية",
    "city": "damascus",
    "needs_delivery": True,
}
QUOTE = {"price": 40, "duration_days": 2, "offers_delivery": True, "message": "جاهز"}


@pytest.fixture
def setup(make_actor, catalog):
    customer = make_actor("customer", "سارة العتيبي")
    tailor = make_actor("tailor", "أبو أحمد")
    tailor.patch("/api/v1/tailors/me/profile", {"city": "damascus", "offers_delivery": True})
    rival = make_actor("tailor", "خالد")
    request = customer.post("/api/v1/requests", {**REQUEST, "service_id": catalog["hem"]})
    assert request.status_code == 201, request.text
    return customer, tailor, rival, request.json()


def test_full_happy_path(setup, client):
    customer, tailor, rival, request = setup

    # Tailor sees the request in their city feed, with only the customer's first name.
    feed = tailor.get("/api/v1/tailors/me/requests").json()
    assert [r["id"] for r in feed["items"]] == [request["id"]]
    assert feed["items"][0]["customer"]["name"] == "سارة"

    q1 = tailor.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE)
    assert q1.status_code == 201, q1.text
    q2 = rival.post(f"/api/v1/requests/{request['id']}/quotes", {**QUOTE, "price": 55})
    assert q2.status_code == 201

    # Customer sees both quotes and a conversation per tailor; got a notification.
    detail = customer.get(f"/api/v1/requests/{request['id']}").json()
    assert detail["status"] == "quotes_received"
    assert {q["price"] for q in detail["quotes"]} == {40, 55}
    assert all(q["conversation_id"] for q in detail["quotes"])
    notes = customer.get("/api/v1/notifications").json()["items"]
    assert {n["type"] for n in notes} == {"quote_received"}

    # Rival sees only their own quote.
    rival_view = rival.get(f"/api/v1/requests/{request['id']}").json()
    assert rival_view["quotes"] is None and rival_view["my_quote"]["price"] == 55

    order = customer.post(f"/api/v1/quotes/{q1.json()['id']}/accept")
    assert order.status_code == 200, order.text
    order = order.json()
    assert order["price"] == 40 and order["delivery"] is True
    assert order["commission_amount"] is None  # hidden from customer
    assert order["reference"].startswith("KH-")

    # Other quote rejected; request closed to new quotes.
    assert rival.get(f"/api/v1/requests/{request['id']}").json()["my_quote"]["status"] == \
        "rejected"
    late = rival.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE)
    assert late.status_code == 409, late.text

    # Tailor sees money split; drives the order through its stages.
    tailor_view = tailor.get(f"/api/v1/orders/{order['id']}").json()
    assert tailor_view["commission_amount"] == 4.8 and tailor_view["tailor_payout"] == 35.2
    assert set(tailor_view["allowed_transitions"]) == {"in_progress", "cancelled"}
    for status in ("in_progress", "ready", "out_for_delivery", "delivered"):
        res = tailor.post(f"/api/v1/orders/{order['id']}/status", {"status": status})
        assert res.status_code == 200, (status, res.text)

    # Only the customer can confirm completion.
    assert tailor.post(f"/api/v1/orders/{order['id']}/status",
                       {"status": "completed"}).status_code == 409
    done = customer.post(f"/api/v1/orders/{order['id']}/status", {"status": "completed"}).json()
    assert done["status"] == "completed" and done["can_review"] is True
    assert [e["status"] for e in done["events"]] == [
        "confirmed", "in_progress", "ready", "out_for_delivery", "delivered", "completed"]
    assert customer.get(f"/api/v1/requests/{request['id']}").json()["status"] == "completed"

    review = customer.post("/api/v1/reviews", {"order_id": order["id"], "rating": 5,
                                               "comment": "ممتاز"})
    assert review.status_code == 201
    assert customer.post("/api/v1/reviews", {"order_id": order["id"], "rating": 4}) \
        .status_code == 409

    public = client.get(f"/api/v1/tailors/{tailor.id}").json()
    assert public["rating_avg"] == 5.0 and public["rating_count"] == 1
    reviews = client.get(f"/api/v1/tailors/{tailor.id}/reviews").json()["items"]
    assert reviews[0]["author_name"] == "سارة" and reviews[0]["comment"] == "ممتاز"

    earnings = tailor.get("/api/v1/tailors/me/earnings").json()
    assert earnings == {"completed_orders": 1, "active_orders": 0, "total_earned": 35.2,
                        "pending_payout": 0, "total_commission": 4.8}


def test_permissions(setup, make_actor):
    customer, tailor, _, request = setup
    stranger = make_actor("customer")

    assert stranger.get(f"/api/v1/requests/{request['id']}").status_code == 404
    assert customer.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE).status_code == 403
    assert tailor.post("/api/v1/requests", REQUEST).status_code == 403

    quote = tailor.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE).json()
    assert tailor.post(f"/api/v1/quotes/{quote['id']}/accept").status_code == 403
    assert stranger.post(f"/api/v1/quotes/{quote['id']}/accept").status_code == 404

    order = customer.post(f"/api/v1/quotes/{quote['id']}/accept").json()
    assert stranger.get(f"/api/v1/orders/{order['id']}").status_code == 404
    # Customer cannot drive tailor steps; review not allowed before completion.
    assert customer.post(f"/api/v1/orders/{order['id']}/status",
                         {"status": "in_progress"}).status_code == 409
    assert customer.post("/api/v1/reviews", {"order_id": order["id"], "rating": 5}) \
        .status_code == 409


def test_cancel_order_reopens_nothing_and_notifies(setup):
    customer, tailor, _, request = setup
    quote = tailor.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE).json()
    order = customer.post(f"/api/v1/quotes/{quote['id']}/accept").json()
    res = customer.post(f"/api/v1/orders/{order['id']}/cancel")
    assert res.json()["status"] == "cancelled"
    assert customer.get(f"/api/v1/requests/{request['id']}").json()["status"] == "cancelled"
    types = [n["type"] for n in tailor.get("/api/v1/notifications").json()["items"]]
    assert "order_status" in types


def test_withdraw_and_requote(setup):
    customer, tailor, _, request = setup
    quote = tailor.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE).json()
    assert tailor.post(f"/api/v1/quotes/{quote['id']}/withdraw").json()["status"] == "withdrawn"
    assert customer.get(f"/api/v1/requests/{request['id']}").json()["status"] == "open"
    again = tailor.post(f"/api/v1/requests/{request['id']}/quotes", {**QUOTE, "price": 35})
    assert again.json()["status"] == "pending" and again.json()["price"] == 35


def test_cancel_open_request(setup):
    customer, tailor, _, request = setup
    tailor.post(f"/api/v1/requests/{request['id']}/quotes", QUOTE)
    res = customer.post(f"/api/v1/requests/{request['id']}/cancel")
    assert res.json()["status"] == "cancelled"
    assert tailor.get(f"/api/v1/requests/{request['id']}").json()["my_quote"]["status"] == \
        "rejected"
    assert tailor.get("/api/v1/tailors/me/requests").json()["total"] == 0


def test_request_validation(make_actor, catalog):
    customer = make_actor("customer")
    bad = customer.post("/api/v1/requests", {**REQUEST, "city": "atlantis",
                                             "photo_urls": ["https://evil.example/x.png"]})
    assert bad.status_code == 422
    fields = {e["field"] for e in bad.json()["errors"]}
    assert {"city", "photo_urls"} <= fields

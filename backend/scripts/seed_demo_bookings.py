"""Fill a deployed Khayyat with demo bookings through the public API.

Usage: python -m scripts.seed_demo_bookings https://khayyat-backend.onrender.com/api/v1

Needs staff@khayyat-demo.com listed in the server's ADMIN_EMAILS. Every booking it creates
belongs to the demo customer account, so it never touches real customers' data.
"""

import json
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

CUSTOMER = ("demo@khayyat-demo.com", "Khayyat-Demo-2026", "سارة الشامي")
STAFF = ("staff@khayyat-demo.com", "Khayyat-Staff-2026", "فريق خيّاط")
ADDRESS = {"district": "المزة", "address_line": "شارع الجلاء، بناء 12، الطابق 3",
           "contact_phone": "0991234567"}


def call(base, path, body=None, token=None):
    req = urllib.request.Request(
        base + path, method="POST" if body is not None else "GET",
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json",
                 **({"Authorization": f"Bearer {token}"} if token else {})},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{path}: {e.code} {e.read().decode()[:300]}") from e


def account(base, email, password, name):
    try:
        call(base, "/auth/register", {"full_name": name, "email": email, "password": password})
    except RuntimeError as e:
        if " 409 " not in str(e):
            raise
    return call(base, "/auth/login", {"identifier": email, "password": password})["access_token"]


def open_days(n):
    d, out = date.today() + timedelta(days=1), []
    while len(out) < n:
        if d.weekday() != 4:  # closed Fridays
            out.append(d.isoformat())
        d += timedelta(days=1)
    return out


def main(base):
    cust = account(base, *CUSTOMER)
    staff = account(base, *STAFF)
    if "admin" not in call(base, "/auth/me", token=staff)["roles"]:
        sys.exit("staff@khayyat-demo.com is not in ADMIN_EMAILS on this server")
    if call(base, "/bookings", token=cust):
        print("Demo customer already has bookings; nothing to do.")
        return

    d = open_days(4)
    plan = [
        # (payload, steps to advance, assignee, final price, review)
        ({"service_type": "van_pickup", "description": "تضييق خصر بنطلون قماش وتقصيره 3 سانتي",
          "garment": "trousers", "scheduled_date": d[0], "slot": "10:00", **ADDRESS},
         8, "فان 1 · أبو أحمد", 9, (5, "شغل نظيف ووصل بالوقت")),
        ({"service_type": "home_service", "description": "تقصير أكمام جاكيت البدلة 2 سانتي",
          "garment": "jacket", "scheduled_date": d[0], "slot": "14:00", **ADDRESS},
         5, "أبو أحمد · خيّاط", None, None),
        ({"service_type": "van_pickup", "description": "تعديل عباية: تقصير وتضييق الأكمام",
          "garment": "abaya", "scheduled_date": d[1], "slot": "12:00", **ADDRESS},
         3, "فان 2 · أبو خالد", None, None),
        ({"service_type": "quick_fix", "description": "", "quick_items": ["button", "zipper"],
          "scheduled_date": d[1], "slot": "16:00", **ADDRESS},
         1, None, None, None),
        ({"service_type": "shop_visit", "description": "تفصيل ثوب جديد للعيد، بدي اختار القماش بالمحل",
          "garment": "other", "scheduled_date": d[2], "slot": "17:00"},
         0, None, None, None),
    ]
    for payload, steps, assignee, price, review in plan:
        b = call(base, "/bookings", {"city": "damascus", **payload}, cust)
        for i in range(steps):
            call(base, f"/staff/bookings/{b['id']}/advance",
                 {"assignee_name": assignee if i == 1 else None}, staff)
            if price and i == 4:
                call(base, f"/staff/bookings/{b['id']}/price", {"final_price_usd": price}, staff)
        if review:
            call(base, f"/staff/bookings/{b['id']}/paid", {}, staff)
            call(base, f"/bookings/{b['id']}/review", {"rating": review[0], "comment": review[1]}, cust)
        print(b["reference"], payload["service_type"], "->", steps, "steps")

    call(base, "/support/messages", {"body": "مرحبا، العباية لونها كحلي، فيكن تجيبوا خيطان بنفس اللون؟"}, cust)
    me = call(base, "/auth/me", token=cust)["id"]
    call(base, f"/staff/support/{me}", {"body": "أكيد سارة، الخيّاط رح يجيب معه ألوان قريبة وتختاري."}, staff)
    print("Demo data ready.")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000/api/v1")

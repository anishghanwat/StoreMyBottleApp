# Bottle Expiry & Notifications Plan

## Current State

Expiry logic already exists but is silent:
- `purchases.py` calculates expiry as `purchased_at + 30 days` on every `/my-bottles` call
- `MyBottles.tsx` already shows `daysLeft` and an "Expires today!" label in the UI
- No expiry date is stored on the `Purchase` model — it's always computed on the fly
- No notifications of any kind are sent to users before expiry
- No tracking of whether a warning has already been sent (so no deduplication)

---

## Notification Channels

Two channels to implement:

1. Email — via Resend (see `EMAIL_SERVICE_PLAN.md`)
2. Push notifications — via Web Push API (browser-based, works with PWA)

Email is the baseline. Push notifications are the upgrade once PWA is implemented.

---

## Phase 1 — Model Changes

### Add expiry tracking columns to `Purchase` (`backend/models.py`)

- `expires_at` — DateTime, nullable — store the computed expiry date at purchase confirmation time instead of computing it every request. Makes querying for expiring bottles trivial.
- `warning_7d_sent` — Boolean, default False — tracks whether the 7-day warning was sent
- `warning_1d_sent` — Boolean, default False — tracks whether the 1-day warning was sent

### Where to set `expires_at`

In `backend/routers/purchases.py`, inside the Razorpay `verify-payment` endpoint (post-payment integration), when `payment_status` is set to `confirmed`:

```python
purchase.purchased_at = datetime.now(timezone.utc)
purchase.expires_at = purchase.purchased_at + timedelta(days=30)
```

Also update the existing `get_my_bottles` and `get_purchase_history` endpoints to use `purchase.expires_at` directly instead of computing it inline.

A migration script will be needed for the new columns.

---

## Phase 2 — Expiry Warning Cron Job

Create `backend/send_expiry_warnings.py` — a standalone script run by cron daily.

### Logic

```
Run daily at 10:00 AM (local time of users — or UTC if users are in one timezone)

Query 1: 7-day warnings
  SELECT purchases WHERE:
    - payment_status = confirmed
    - remaining_ml > 0
    - expires_at BETWEEN now+6d AND now+8d   (window to catch the right day)
    - warning_7d_sent = False

Query 2: 1-day warnings
  SELECT purchases WHERE:
    - payment_status = confirmed
    - remaining_ml > 0
    - expires_at BETWEEN now AND now+2d
    - warning_1d_sent = False

For each result:
  - Send expiry warning email via email_service.py
  - Set warning_7d_sent = True (or warning_1d_sent = True)
  - Commit
```

Using a time window (±1 day) instead of exact day match prevents missed notifications
if the cron job runs slightly late or the server restarts.

### Cron setup on EC2

```bash
# Edit crontab
crontab -e

# Run daily at 10am UTC
0 10 * * * cd /app && python send_expiry_warnings.py >> /var/log/expiry_warnings.log 2>&1
```

### Script structure

```python
# send_expiry_warnings.py
from database import SessionLocal
from models import Purchase, PaymentStatus
from email_service import send_expiry_warning_email
from datetime import datetime, timedelta, timezone

def send_warnings():
    db = SessionLocal()
    now = datetime.now(timezone.utc)

    # 7-day warnings
    seven_day_purchases = db.query(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.remaining_ml > 0,
        Purchase.expires_at >= now + timedelta(days=6),
        Purchase.expires_at <= now + timedelta(days=8),
        Purchase.warning_7d_sent == False
    ).all()

    for purchase in seven_day_purchases:
        try:
            send_expiry_warning_email(
                email=purchase.user.email,
                user_name=purchase.user.name,
                bottle_name=purchase.bottle.name,
                bottle_brand=purchase.bottle.brand,
                venue_name=purchase.venue.name,
                remaining_ml=purchase.remaining_ml,
                expires_at=purchase.expires_at,
                days_left=7
            )
            purchase.warning_7d_sent = True
        except Exception as e:
            print(f"Failed to send 7d warning for {purchase.id}: {e}")

    # 1-day warnings
    one_day_purchases = db.query(Purchase).filter(
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.remaining_ml > 0,
        Purchase.expires_at >= now,
        Purchase.expires_at <= now + timedelta(days=2),
        Purchase.warning_1d_sent == False
    ).all()

    for purchase in one_day_purchases:
        try:
            send_expiry_warning_email(
                email=purchase.user.email,
                user_name=purchase.user.name,
                bottle_name=purchase.bottle.name,
                bottle_brand=purchase.bottle.brand,
                venue_name=purchase.venue.name,
                remaining_ml=purchase.remaining_ml,
                expires_at=purchase.expires_at,
                days_left=1
            )
            purchase.warning_1d_sent = True
        except Exception as e:
            print(f"Failed to send 1d warning for {purchase.id}: {e}")

    db.commit()
    db.close()

if __name__ == "__main__":
    send_warnings()
```

---

## Phase 3 — Email Templates

Two variants of the expiry warning email (both handled by one function with a `days_left` param).

### 7-Day Warning Email

Subject: `Your bottle expires in 7 days — don't let it go to waste`

Content:
- Bottle name, brand, venue
- Remaining ml
- Expiry date (formatted clearly)
- Urgency message: "You have 7 days to redeem your remaining X ml"
- CTA button: "Redeem Now" → links to `/my-bottles`

Tone: friendly reminder, not alarming

### 1-Day Warning Email

Subject: `⚠️ Last chance — your bottle expires tomorrow`

Content:
- Same details as above
- Stronger urgency: "Your bottle expires tomorrow. Visit [venue] tonight to redeem."
- CTA button: "Redeem Now" → links to `/my-bottles`

Tone: urgent but not aggressive

Both emails go in `backend/email_service.py` as `send_expiry_warning_email(days_left=7|1)`.

---

## Phase 4 — Push Notifications (PWA)

Once the PWA is implemented (see `PWA_IMPLEMENTATION_PLAN.md`), add Web Push notifications
as a second channel alongside email.

### Setup

1. Generate VAPID keys (one-time):
   ```bash
   pip install pywebpush
   python -c "from pywebpush import webpush, Vapid; v = Vapid(); v.generate_keys(); print(v.public_key, v.private_key)"
   ```
2. Add to `backend/.env`:
   ```
   VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_CLAIMS_EMAIL=admin@storemybottle.com
   ```

### New model: `PushSubscription`

```python
class PushSubscription(Base):
    __tablename__ = "push_subscriptions"
    id          = Column(String(36), primary_key=True, default=generate_uuid)
    user_id     = Column(String(36), ForeignKey("users.id"), nullable=False)
    endpoint    = Column(Text, nullable=False)
    p256dh      = Column(Text, nullable=False)   # encryption key
    auth        = Column(Text, nullable=False)    # auth secret
    created_at  = Column(DateTime, server_default=func.now())
```

### New endpoint: `POST /api/push/subscribe`

Called from the frontend after the user grants notification permission.
Saves the push subscription object (endpoint + keys) to the database.

### Frontend: request permission

In `MyBottles.tsx`, after the page loads and the user has active bottles, show a
one-time prompt:

```
"Get notified before your bottles expire?"
[Enable Notifications]  [Not now]
```

Only show if:
- Browser supports push notifications
- User hasn't already subscribed or dismissed
- User has at least one active bottle

On click → call `Notification.requestPermission()` → if granted, call
`navigator.serviceWorker.ready` → `pushManager.subscribe()` → POST to `/api/push/subscribe`

### Sending push notifications

In `send_expiry_warnings.py`, after sending the email, also send a push notification
if the user has a push subscription:

```python
from pywebpush import webpush
subscription = db.query(PushSubscription).filter_by(user_id=purchase.user_id).first()
if subscription:
    webpush(
        subscription_info={
            "endpoint": subscription.endpoint,
            "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth}
        },
        data=json.dumps({
            "title": "Bottle expiring soon",
            "body": f"{purchase.bottle.name} expires in {days_left} day(s). {purchase.remaining_ml}ml remaining.",
            "url": "/my-bottles"
        }),
        vapid_private_key=settings.VAPID_PRIVATE_KEY,
        vapid_claims={"sub": f"mailto:{settings.VAPID_CLAIMS_EMAIL}"}
    )
```

### Service worker: handle push event

In the PWA service worker, handle the `push` event to show the notification:

```javascript
self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      data: { url: data.url }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

---

## Phase 5 — Frontend: In-App Expiry Indicators

`MyBottles.tsx` already shows `daysLeft` — enhance it slightly:

- Bottles expiring in ≤ 7 days: show the expiry countdown in amber
- Bottles expiring in ≤ 1 day: show in red with a pulsing dot
- Sort active bottles so soonest-to-expire appear first (currently unsorted)

This is a small frontend-only change, no backend needed.

---

## Phase 6 — Admin Visibility

Add to the admin dashboard:
- A "Expiring Soon" widget showing count of bottles expiring in the next 7 days
- Filter in the Purchases view: "Expiring in 7 days" / "Expiring in 1 day" / "Expired"

This helps the business understand how much value is about to be lost and potentially
run targeted promotions to drive redemptions.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `backend/models.py` | Add `expires_at`, `warning_7d_sent`, `warning_1d_sent` to `Purchase`; add `PushSubscription` model |
| `backend/routers/purchases.py` | Set `expires_at` on payment confirmation; use it in `get_my_bottles` |
| `backend/email_service.py` | Add `send_expiry_warning_email(days_left)` |
| `backend/send_expiry_warnings.py` | Create — standalone cron script |
| `backend/routers/push.py` | Create — `POST /api/push/subscribe` endpoint |
| `backend/requirements.txt` | Add `pywebpush` |
| `backend/.env` | Add VAPID keys |
| `backend/migrate_expiry.py` | Migration script for new columns |
| `frontend/src/app/screens/MyBottles.tsx` | Sort by expiry, enhanced expiry indicators, push permission prompt |
| `frontend/src/services/purchase.service.ts` | No changes needed |
| `frontend/src/services/push.service.ts` | Create — handles push subscription registration |
| `admin/src/components/Dashboard.tsx` | Add "Expiring Soon" widget |
| `admin/src/components/Purchases.tsx` | Add expiry filter |

---

## Notification Summary

| Notification | Channel | Timing | Trigger |
|---|---|---|---|
| 7-day warning | Email + Push | 7 days before expiry | Daily cron |
| 1-day warning | Email + Push | 1 day before expiry | Daily cron |
| In-app indicator | UI | Real-time | MyBottles screen |

---

## Notes

- Push notifications only work over HTTPS — already configured
- Push notifications require the PWA service worker to be registered first
- Users who signed up with phone (no email) won't receive email warnings — push is the only channel for them
- The `warning_7d_sent` / `warning_1d_sent` flags prevent duplicate sends if the cron runs multiple times
- Bottles with `remaining_ml = 0` are excluded — no point warning about an empty bottle

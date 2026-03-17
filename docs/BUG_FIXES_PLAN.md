# Bug Fixes Plan

**Issues:** 9 identified  
**Quick fixes (1–2, 4–8):** Can all be done in one session  
**Major fix (3):** Razorpay integration — separate focused session  

---

## Issue 1 — Expiry notifications: no deduplication

### Problem
`send_expiry_warnings.py` has no memory of what it has already sent. Running it twice on the same day sends duplicate emails to every user.

The plan in `BOTTLE_EXPIRY_NOTIFICATIONS_PLAN.md` called for `warning_7d_sent` and `warning_1d_sent` boolean flags on the `Purchase` model, but they were never added.

### Files to change
| File | Change |
|---|---|
| `backend/models.py` | Add `warning_7d_sent`, `warning_1d_sent` columns to `Purchase` |
| `backend/migrate_expiry_flags.py` | New migration script |
| `backend/send_expiry_warnings.py` | Filter on flags, set them after sending |

### Exact changes

**`backend/models.py` — inside `Purchase` class, after `purchased_at`:**
```python
warning_7d_sent = Column(Boolean, default=False, nullable=False)
warning_1d_sent = Column(Boolean, default=False, nullable=False)
```

**`backend/migrate_expiry_flags.py` — new file:**
```python
"""Add warning_7d_sent and warning_1d_sent to purchases table"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE purchases
            ADD COLUMN IF NOT EXISTS warning_7d_sent BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS warning_1d_sent BOOLEAN NOT NULL DEFAULT FALSE
        """))
        conn.commit()
    print("✅ Migration complete")

if __name__ == "__main__":
    migrate()
```

**`backend/send_expiry_warnings.py` — replace the bucket loop logic:**

For 7-day bucket, add to the query filter:
```python
Purchase.warning_7d_sent == False
```

After a successful send, set the flag:
```python
purchase.warning_7d_sent = True
```

For 1-day bucket:
```python
Purchase.warning_1d_sent == False
# after send:
purchase.warning_1d_sent = True
```

Commit after each batch, not just at the end, so a partial run doesn't re-send on retry.

---

## Issue 2 — Expiry notifications: wrong window logic

### Problem
`days_left in (1, 7)` uses `timedelta.days` which truncates fractional days. A bottle expiring at 11pm when the cron runs at 9am has `days_left = 6` (not 7) and gets silently skipped.

### Files to change
| File | Change |
|---|---|
| `backend/send_expiry_warnings.py` | Replace integer `days_left` check with time-window range query |

### Exact changes

Replace the current approach of computing `days_left` per-purchase in Python with a direct DB query using time windows. This also makes the query efficient at scale.

**Replace the entire `purchases` query block with two separate queries:**

```python
now = datetime.now(timezone.utc)

# 7-day window: expires between 6d and 8d from now
seven_day_purchases = db.query(Purchase).filter(
    Purchase.payment_status == PaymentStatus.CONFIRMED,
    Purchase.remaining_ml > 0,
    Purchase.purchased_at.isnot(None),                          # Issue 8 guard
    Purchase.warning_7d_sent == False,                          # Issue 1 dedup
    # compute expires_at inline: purchased_at + 30 days
    Purchase.purchased_at >= now - timedelta(days=24),          # purchased at most 24 days ago
    Purchase.purchased_at <= now - timedelta(days=22),          # purchased at least 22 days ago
).all()

# 1-day window: expires between 0d and 2d from now
one_day_purchases = db.query(Purchase).filter(
    Purchase.payment_status == PaymentStatus.CONFIRMED,
    Purchase.remaining_ml > 0,
    Purchase.purchased_at.isnot(None),
    Purchase.warning_1d_sent == False,
    Purchase.purchased_at >= now - timedelta(days=31),
    Purchase.purchased_at <= now - timedelta(days=29),
).all()
```

> The window logic: if `expires_at = purchased_at + 30d`, then "expires in ~7 days" means `purchased_at` is between 22 and 24 days ago. "Expires in ~1 day" means `purchased_at` is between 29 and 31 days ago. This gives a ±1 day window that survives cron timing drift.

Then process each list separately, setting `warning_7d_sent` or `warning_1d_sent` accordingly.

---

## Issue 3 — Payment flow: still manual bartender-confirm

### Problem
`Payment.tsx` shows "Show this to the bartender to pay" and polls `getPurchase` every 3 seconds. No real payment gateway is integrated. `purchase.service.ts` still has `confirmPayment()` calling the old `/purchases/{id}/confirm` endpoint.

### This is the largest change — treat as a separate session

### Files to change
| File | Change |
|---|---|
| `backend/requirements.txt` | Add `razorpay` |
| `backend/.env` | Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| `backend/config.py` | Add Razorpay settings fields |
| `backend/models.py` | Add `razorpay_order_id`, `razorpay_payment_id` to `Purchase` |
| `backend/routers/purchases.py` | Add `POST /{id}/create-razorpay-order`, `POST /{id}/verify-payment`, `POST /webhooks/razorpay`; remove `POST /{id}/confirm`, `POST /{id}/process`, `GET /venue/{id}/pending` |
| `frontend/index.html` | Add Razorpay checkout.js script tag |
| `frontend/src/services/purchase.service.ts` | Add `createRazorpayOrder()`, `verifyPayment()`; remove `confirmPayment()` |
| `frontend/src/app/screens/Payment.tsx` | Replace polling loop + "show bartender" UI with Razorpay checkout modal |
| `frontend-bartender/src/app/pages/BartenderHome.tsx` | Remove Requests tab and pending payment confirm/reject UI |
| `frontend-bartender/src/app/pages/DrinkDetails.tsx` | Remove confirm/reject payment buttons (already done in scan flow fix) |

### Backend implementation outline

**`POST /api/purchases/{purchase_id}/create-razorpay-order`**
```python
import razorpay
client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

order = client.order.create({
    "amount": int(purchase.purchase_price * 100),  # paise
    "currency": "INR",
    "receipt": purchase.id,
    "notes": {"purchase_id": purchase.id}
})

purchase.razorpay_order_id = order["id"]
db.commit()

return {
    "razorpay_order_id": order["id"],
    "amount": order["amount"],
    "currency": order["currency"],
    "key_id": settings.RAZORPAY_KEY_ID
}
```

**`POST /api/purchases/{purchase_id}/verify-payment`**
```python
# Request body: razorpay_payment_id, razorpay_order_id, razorpay_signature

import hmac, hashlib

expected = hmac.new(
    settings.RAZORPAY_KEY_SECRET.encode(),
    f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
    hashlib.sha256
).hexdigest()

if not hmac.compare_digest(expected, razorpay_signature):
    raise HTTPException(400, "Invalid payment signature")

purchase.payment_status = PaymentStatus.CONFIRMED
purchase.razorpay_payment_id = razorpay_payment_id
purchase.purchased_at = datetime.now(timezone.utc)
db.commit()
# send confirmation email
```

**`POST /api/webhooks/razorpay`**
```python
# Verify webhook signature
# Handle: payment.captured → confirm purchase
# Handle: payment.failed → mark failed
```

### Frontend implementation outline

**`frontend/index.html`** — add before `</body>`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

**`Payment.tsx`** — replace the entire polling + "show bartender" block:
```typescript
const handlePayment = async () => {
  // 1. Create Razorpay order
  const order = await purchaseService.createRazorpayOrder(purchase.id);

  // 2. Open Razorpay checkout
  const rzp = new (window as any).Razorpay({
    key: order.key_id,
    amount: order.amount,
    currency: order.currency,
    order_id: order.razorpay_order_id,
    name: "StoreMyBottle",
    description: `${bottle.brand} ${bottle.name}`,
    prefill: { name: user.name, email: user.email },
    theme: { color: "#7C3AED" },
    handler: async (response: any) => {
      // 3. Verify on backend
      await purchaseService.verifyPayment(purchase.id, {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature,
      });
      navigate("/payment-success", { state: { purchase, bottle, venue } });
    },
  });
  rzp.open();
};
```

Remove: payment method selection UI, 3-second polling interval, countdown timer, "show to bartender" messaging.

---

## Issue 4 — Bartender: `getFullHistory` calls non-existent endpoint

### Problem
`frontend-bartender/src/services/api.ts` calls `/redemptions/venue/${venueId}/history` but `backend/routers/redemptions.py` only has `/venue/{venue_id}/recent`. `RedemptionHistory.tsx` will 404 on load.

The existing `getHistory` call in `RedemptionHistory.tsx` already uses `redemptionService.getHistory(venueId, 100)` which maps to `/recent?limit=100` — that works. The broken one is `getFullHistory` which is defined but not actually called in the current `RedemptionHistory.tsx`. So the page works today, but the dead method is a trap.

### Option A — Add the missing backend endpoint (recommended)
Gives proper status filtering server-side, better for large datasets.

**`backend/routers/redemptions.py` — add new route:**
```python
@router.get("/venue/{venue_id}/history", response_model=RedemptionHistoryList)
def get_venue_full_history(
    venue: Venue = Depends(verify_venue_access),
    status: Optional[str] = None,
    limit: int = 200,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    query = db.query(Redemption).filter(Redemption.venue_id == venue.id)
    if status:
        query = query.filter(Redemption.status == status)
    redemptions = query.order_by(Redemption.created_at.desc()).limit(limit).all()
    # ... same transform as /recent
```

### Option B — Fix the frontend service (simpler)
Remove `getFullHistory` from `api.ts` and update `RedemptionHistory.tsx` to use `getHistory` with a high limit. Acceptable since the page already does client-side status filtering.

**Recommended: Option A** — keeps filtering server-side, removes the 404 risk entirely.

---

## Issue 5 — `admin/.env` has placeholder Cloudinary cloud name

### Problem
`admin/.env` has `VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here`. The real value is `dcrxolsfo` (visible in `.env.docker`). Local dev image uploads will silently fail.

### Files to change
| File | Change |
|---|---|
| `admin/.env` | Replace `your_cloud_name_here` with `dcrxolsfo` |

### Exact change
```diff
- VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
+ VITE_CLOUDINARY_CLOUD_NAME=dcrxolsfo
```

---

## Issue 6 — `admin/.env.development` missing Cloudinary vars

### Problem
Vite loads `.env.development` over `.env` when running `npm run dev`. The current `.env.development` only has `VITE_API_URL` — no Cloudinary vars. So even after fixing Issue 5, local dev still won't have the vars.

### Files to change
| File | Change |
|---|---|
| `admin/.env.development` | Add Cloudinary vars |

### Exact change — append to `admin/.env.development`:
```bash
# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=dcrxolsfo
VITE_CLOUDINARY_UPLOAD_PRESET=storemybottle_unsigned
```

---

## Issue 7 — `image-upload.tsx`: silent fail when Cloudinary script not loaded

### Problem
`openWidget()` does `if (!window.cloudinary) return` with no feedback. If the user clicks "Upload Image" before the external script finishes loading, nothing happens — no spinner, no error, no retry.

### Files to change
| File | Change |
|---|---|
| `admin/src/components/ui/image-upload.tsx` | Add script-loaded state, show feedback while loading, retry on click |

### Exact changes

Add a `scriptLoaded` state:
```typescript
const [scriptLoaded, setScriptLoaded] = useState(!!window.cloudinary)
```

Update the `useEffect` that loads the script:
```typescript
useEffect(() => {
  if (window.cloudinary) { setScriptLoaded(true); return; }
  const script = document.createElement("script")
  script.src = "https://upload-widget.cloudinary.com/global/all.js"
  script.async = true
  script.onload = () => setScriptLoaded(true)
  document.body.appendChild(script)
}, [])
```

Update `openWidget()`:
```typescript
const openWidget = () => {
  if (!scriptLoaded) {
    // Script still loading — show feedback
    setLoading(true)
    const wait = setInterval(() => {
      if (window.cloudinary) {
        clearInterval(wait)
        setLoading(false)
        setScriptLoaded(true)
        // re-trigger open
        openWidget()
      }
    }, 200)
    return
  }
  // ... rest of existing openWidget logic
}
```

Update the button to disable when script is loading:
```tsx
<Button
  type="button"
  variant="outline"
  onClick={openWidget}
  disabled={loading}
  className="w-full"
>
  <Upload className="w-4 h-4 mr-2" />
  {loading ? (scriptLoaded ? "Opening..." : "Loading uploader...") : value ? "Change Image" : "Upload Image"}
</Button>
```

---

## Issue 8 — `send_expiry_warnings.py`: processes unconfirmed purchases

### Problem
The script queries all `CONFIRMED` purchases but then falls back to `created_at` if `purchased_at` is null:
```python
purchase_date = p.purchased_at or p.created_at
```
A confirmed purchase should always have `purchased_at` set, but if it's somehow null (data inconsistency), the expiry is computed from `created_at` which is wrong. More importantly, the fix for Issues 1 & 2 requires `purchased_at` to be non-null for the window query to work correctly.

### Files to change
| File | Change |
|---|---|
| `backend/send_expiry_warnings.py` | Add explicit `purchased_at.isnot(None)` filter to the query |
| `backend/models.py` | Add `expires_at` column to `Purchase` (set at confirmation time) |
| `backend/routers/purchases.py` | Set `expires_at` when confirming a purchase |
| `backend/migrate_expiry_flags.py` | Include `expires_at` column in the same migration (combine with Issue 1) |

### Exact changes

**`backend/models.py` — add to `Purchase` after `purchased_at`:**
```python
expires_at = Column(DateTime(timezone=True), nullable=True)
```

**`backend/routers/purchases.py` — in `confirm_purchase` and `process_purchase` (bartender confirm), after setting `purchased_at`:**
```python
purchase.purchased_at = datetime.now(timezone.utc)
purchase.expires_at = purchase.purchased_at + timedelta(days=30)
```

**`backend/migrate_expiry_flags.py` — add `expires_at` to the same migration:**
```sql
ALTER TABLE purchases
ADD COLUMN IF NOT EXISTS warning_7d_sent BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS warning_1d_sent BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expires_at DATETIME NULL;
```

Also backfill `expires_at` for existing confirmed purchases:
```sql
UPDATE purchases
SET expires_at = DATE_ADD(purchased_at, INTERVAL 30 DAY)
WHERE payment_status = 'confirmed' AND purchased_at IS NOT NULL AND expires_at IS NULL;
```

**`backend/send_expiry_warnings.py` — update the query to use `expires_at` directly (cleaner than the window math):**
```python
now = datetime.now(timezone.utc)

seven_day_purchases = db.query(Purchase).filter(
    Purchase.payment_status == PaymentStatus.CONFIRMED,
    Purchase.remaining_ml > 0,
    Purchase.purchased_at.isnot(None),
    Purchase.expires_at.isnot(None),
    Purchase.warning_7d_sent == False,
    Purchase.expires_at >= now + timedelta(days=6),
    Purchase.expires_at <= now + timedelta(days=8),
).all()

one_day_purchases = db.query(Purchase).filter(
    Purchase.payment_status == PaymentStatus.CONFIRMED,
    Purchase.remaining_ml > 0,
    Purchase.purchased_at.isnot(None),
    Purchase.expires_at.isnot(None),
    Purchase.warning_1d_sent == False,
    Purchase.expires_at >= now,
    Purchase.expires_at <= now + timedelta(days=2),
).all()
```

---

## Issue 9 — `RedeemPeg.tsx`: misleading `bottleId` variable name

### Problem
The route is `/redeem/:bottleId` but the param is actually the **purchase ID** (`UserBottle.id` is the purchase ID). The variable name `bottleId` is misleading. Functionally correct today but a trap for future developers.

### No code change required
This is a naming issue only. Document it here for awareness. If the route is ever refactored, rename the param to `purchaseId` in:
- `frontend/src/app/routes.ts`
- `frontend/src/app/screens/RedeemPeg.tsx`
- `frontend/src/app/screens/RedemptionQR.tsx`
- `frontend/src/app/App.tsx` (route definition)

---

## Implementation Order

### Session 1 — Quick fixes (Issues 1, 2, 4, 5, 6, 7, 8)

Do these together, they're all small and independent:

1. **Issue 8 first** — add `expires_at` to model + migration (other issues depend on it)
2. **Issue 1** — add `warning_7d_sent` / `warning_1d_sent` to model + same migration
3. **Issue 2** — update window logic in `send_expiry_warnings.py` (now uses `expires_at`)
4. **Issue 4** — add `/venue/{venue_id}/history` endpoint to backend
5. **Issue 5** — fix `admin/.env` placeholder
6. **Issue 6** — add Cloudinary vars to `admin/.env.development`
7. **Issue 7** — fix silent fail in `image-upload.tsx`

Run migration after step 3: `python migrate_expiry_flags.py`

### Session 2 — Razorpay (Issue 3)

Dedicated session. Prerequisites:
- Razorpay business account created
- KYC complete
- Test API keys in hand

Steps:
1. Backend: add model columns + migration
2. Backend: add two new endpoints + webhook handler
3. Backend: remove old confirm/process endpoints
4. Frontend: add checkout.js to `index.html`
5. Frontend: update `purchase.service.ts`
6. Frontend: rewrite `Payment.tsx`
7. Bartender: remove Requests tab from `BartenderHome.tsx`
8. Test with Razorpay test cards
9. Switch to live keys

---

## Files Changed Summary

| File | Issues |
|---|---|
| `backend/models.py` | 1, 3, 8 |
| `backend/migrate_expiry_flags.py` | 1, 8 (new file) |
| `backend/send_expiry_warnings.py` | 1, 2, 8 |
| `backend/routers/purchases.py` | 3, 8 |
| `backend/routers/redemptions.py` | 4 |
| `backend/config.py` | 3 |
| `backend/requirements.txt` | 3 |
| `admin/.env` | 5 |
| `admin/.env.development` | 6 |
| `admin/src/components/ui/image-upload.tsx` | 7 |
| `frontend/index.html` | 3 |
| `frontend/src/services/purchase.service.ts` | 3 |
| `frontend/src/app/screens/Payment.tsx` | 3 |
| `frontend-bartender/src/app/pages/BartenderHome.tsx` | 3 |

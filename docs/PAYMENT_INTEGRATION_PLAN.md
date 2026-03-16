# Payment Integration Plan — Razorpay

## Current State

The app has a complete payment flow but no real money movement. Currently:
- Customer creates a purchase (status: `pending`)
- Customer shows the screen to the bartender
- Bartender manually confirms via their portal (`/process` endpoint)
- Purchase flips to `confirmed`

This entire offline/manual flow will be replaced by online payment. Once implemented, payment confirmation is automatic — no bartender involvement needed.

---

## Architecture Decision

Replace the bartender confirmation flow entirely with Razorpay online payment. The purchase is only confirmed after Razorpay verifies the payment server-side. Cash and offline payments are removed.

---

## Phase 1 — Razorpay Setup (Prerequisites)

1. Create a Razorpay business account at [razorpay.com](https://razorpay.com)
2. Complete KYC (business PAN, bank account for settlements)
3. Get test API keys (`rzp_test_...`) and live keys (`rzp_live_...`)
4. Add keys to backend `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Install Razorpay Python SDK:
   ```
   pip install razorpay
   ```

---

## Phase 2 — Backend Changes

### New Endpoints

**`POST /api/purchases/{purchase_id}/create-razorpay-order`**
- Called after a purchase record is created
- Creates a Razorpay order via their API
- Stores `razorpay_order_id` on the purchase record
- Returns `{ razorpay_order_id, amount, currency, key_id }` to the frontend

**`POST /api/purchases/{purchase_id}/verify-payment`**
- Called after the customer completes payment on the Razorpay checkout
- Receives `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
- Verifies the HMAC signature using `KEY_SECRET` — prevents fake confirmations
- On success: sets `payment_status = confirmed`, stores `razorpay_payment_id`, sets `purchased_at`
- On failure: sets `payment_status = failed`

**`POST /api/webhooks/razorpay`** *(recommended)*
- Razorpay sends server-to-server events (payment captured, failed, refunded)
- Verify webhook signature with `RAZORPAY_WEBHOOK_SECRET`
- Handles edge cases where the user closes the app mid-payment

### Endpoints to Remove

- `POST /api/purchases/{purchase_id}/confirm` — no longer needed (was customer self-confirm)
- `POST /api/purchases/{purchase_id}/process` — no longer needed (was bartender manual confirm/reject)
- `GET /api/purchases/venue/{venue_id}/pending` — no longer needed (bartender had this to see pending payments)

### Model Changes

Add to the `Purchase` model in `backend/models.py`:
- `razorpay_order_id` — string, nullable
- `razorpay_payment_id` — string, nullable
- Remove or deprecate `payment_method` cash/offline values — only `online` going forward

A migration script will be needed for the new columns.

---

## Phase 3 — Frontend Changes (Customer)

### Payment.tsx — Simplified Online-Only Flow

1. After `createPurchase()` succeeds → immediately call `createRazorpayOrder()`
2. Load the Razorpay checkout JS SDK (`https://checkout.razorpay.com/v1/checkout.js`)
3. Open the Razorpay modal with order details, prefill customer name/email/phone
4. On `handler` callback (payment success) → call `verifyPayment()` with the 3 signature fields
5. On verification success → navigate to `/payment-success`
6. On failure/dismiss → show error, allow retry or cancel

### Things to Remove from Payment.tsx

- Payment method selection UI (UPI/Card/Cash options) — Razorpay handles method selection internally
- The 3-second polling loop (`getPurchase` every 3s) — verification is now synchronous
- "Show this to the bartender to pay" messaging
- The countdown timer waiting for bartender confirmation

### purchase.service.ts — New Methods

```typescript
createRazorpayOrder(purchaseId: string): Promise<RazorpayOrderResponse>
verifyPayment(purchaseId: string, payload: RazorpayVerifyPayload): Promise<Purchase>
```

### Methods to Remove from purchase.service.ts

- `confirmPayment()` — replaced by `verifyPayment()`

### index.html

Add the Razorpay checkout script:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## Phase 4 — Bartender Portal Changes

The bartender no longer handles payment confirmation at all. Remove:
- Pending purchases list/view
- Confirm/reject payment buttons
- Any UI related to payment approval

The bartender portal scope is now limited to:
- Scanning QR codes to redeem pegs
- Viewing redemption history
- Inventory view

---

## Phase 5 — Admin Panel Changes

- Remove manual payment confirmation tools if any exist
- Update purchase status displays — `pending` should only exist briefly during Razorpay checkout, not as a long-lived state
- Add `razorpay_payment_id` to purchase detail views for reference

---

## Phase 6 — Refunds (Post-launch)

Razorpay supports refunds via API:
- Admin panel gets a "Refund" button on confirmed purchases
- Calls Razorpay refund API with `razorpay_payment_id`
- Updates purchase status to `refunded`

Build this after initial launch.

---

## Files to Modify

| File | Change |
|---|---|
| `backend/models.py` | Add `razorpay_order_id`, `razorpay_payment_id` fields |
| `backend/routers/purchases.py` | Add 2 new endpoints, remove 2 old ones, add webhook handler |
| `backend/requirements.txt` | Add `razorpay` |
| `backend/.env` | Add Razorpay keys |
| `frontend/src/app/screens/Payment.tsx` | Replace offline flow with Razorpay checkout |
| `frontend/src/services/purchase.service.ts` | Add `createRazorpayOrder()`, `verifyPayment()`, remove `confirmPayment()` |
| `frontend/index.html` | Add Razorpay checkout.js script tag |
| `frontend-bartender/src/app/pages/BartenderHome.tsx` | Remove pending payments section |
| `frontend-bartender/src/app/pages/DrinkDetails.tsx` | Remove confirm/reject payment UI |

---

## Security Rules

- Never expose `RAZORPAY_KEY_SECRET` to the frontend — only `KEY_ID` goes to the client
- Always verify the payment signature server-side before confirming — never trust the frontend
- Verify webhook signatures before processing any webhook event
- Use HTTPS for all endpoints (already configured)

---

## Notes

- Razorpay charges ~2% + GST per transaction — factor into pricing if needed
- Test thoroughly with Razorpay test cards before switching to live keys
- Razorpay test card: `4111 1111 1111 1111`, any future expiry, any CVV
- UPI test: use `success@razorpay` as the UPI ID in test mode

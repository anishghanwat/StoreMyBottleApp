# Refunds & Disputes Plan — Razorpay

## Current State

The `Purchase` model has `payment_status` with values: `pending`, `confirmed`, `failed`.
There is no `refunded` status, no `razorpay_payment_id` stored, and no refund logic anywhere.
The admin panel has a purchases view but no refund actions.

Once Razorpay is integrated (see `PAYMENT_INTEGRATION_PLAN.md`), every confirmed purchase
will have a `razorpay_payment_id` which is required to issue refunds via the Razorpay API.

---

## Refund Types

### Full Refund
Customer paid ₹X, gets ₹X back. Happens when:
- Bottle was never redeemed (0 ml consumed)
- Technical issue during purchase
- Customer complaint within a reasonable window

### Partial Refund
Customer paid ₹X, gets back a proportional amount based on remaining ml.
Happens when:
- Customer has partially redeemed the bottle (some pegs consumed)
- Admin decides to refund only the unused portion

Formula: `refund_amount = purchase_price × (remaining_ml / total_ml)`

### No Refund
- Bottle fully redeemed (0 ml remaining)
- Refund window expired (e.g. 7 days after purchase)
- Policy violation

### Chargeback (Razorpay Dispute)
Customer raises a dispute directly with their bank/card issuer.
Razorpay notifies via webhook. Admin must respond with evidence within the deadline
(typically 7–10 days depending on the bank).

---

## Phase 1 — Model Changes

### Purchase model additions (`backend/models.py`)

Add to `PaymentStatus` enum:
```python
REFUNDED = "refunded"
PARTIALLY_REFUNDED = "partially_refunded"
DISPUTED = "disputed"
```

Add columns to `Purchase`:
- `razorpay_payment_id` — string, nullable (added in payment integration phase)
- `refund_amount` — Numeric(10,2), nullable — amount actually refunded
- `refunded_at` — DateTime, nullable
- `refund_reason` — String(500), nullable — admin's reason for refund
- `refund_id` — String(100), nullable — Razorpay refund ID for tracking
- `dispute_id` — String(100), nullable — Razorpay dispute ID if chargeback raised

A migration script will be needed for these columns.

---

## Phase 2 — Backend: Refund Endpoints

### `POST /api/admin/purchases/{purchase_id}/refund`

Admin-only endpoint to issue a refund.

Request body:
```json
{
  "refund_type": "full" | "partial",
  "reason": "Customer complaint - bottle not available",
  "custom_amount": 500.00  // only for partial, optional override
}
```

Logic:
1. Verify purchase exists and `payment_status == confirmed`
2. Verify `razorpay_payment_id` is present
3. Calculate refund amount:
   - Full: `purchase_price`
   - Partial: `purchase_price × (remaining_ml / total_ml)` or `custom_amount`
4. Call Razorpay refund API:
   ```python
   import razorpay
   client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))
   refund = client.payment.refund(razorpay_payment_id, {
       "amount": int(refund_amount * 100),  # Razorpay uses paise
       "notes": {"reason": reason, "purchase_id": purchase_id}
   })
   ```
5. On success:
   - Set `payment_status = refunded` (full) or `partially_refunded` (partial)
   - Set `refund_amount`, `refunded_at`, `refund_reason`, `refund_id`
   - If full refund: set `remaining_ml = 0` (bottle is no longer usable)
   - Log to `AuditLog`
6. Send refund confirmation email to customer (see email service plan)
7. Return updated purchase

### `GET /api/admin/purchases/refunds`

List all refunded/partially refunded purchases with filters:
- Date range
- Venue
- Refund type (full/partial)

Used by admin panel for refund reporting.

---

## Phase 3 — Backend: Dispute/Chargeback Handling

Disputes come in via Razorpay webhooks. The existing webhook handler (from payment integration)
needs to handle these additional events:

### Webhook events to handle

**`payment.dispute.created`**
- Razorpay notifies that a customer raised a chargeback
- Set `payment_status = disputed` on the purchase
- Set `dispute_id` on the purchase
- Create a high-priority support ticket automatically (category: `billing`)
- Send email alert to admin

**`payment.dispute.won`**
- Dispute resolved in our favour
- Set `payment_status = confirmed` (revert to confirmed)
- Update the support ticket to resolved
- Send email to admin

**`payment.dispute.lost`**
- Dispute resolved in customer's favour (bank forced refund)
- Set `payment_status = refunded`
- Set `refund_amount = purchase_price`
- Update the support ticket to closed
- Send email to admin

### Dispute response window
Razorpay gives 7–10 days to respond to a dispute with evidence. The admin panel
needs to surface disputed purchases prominently so they don't get missed.

---

## Phase 4 — Admin Panel Changes

### Purchases List (`admin/src/components/Purchases.tsx`)

Add:
- New status badges: `refunded` (red), `partially_refunded` (orange), `disputed` (yellow/warning)
- Filter by refund status
- "Refund" button on confirmed purchases (opens refund modal)
- Disputed purchases shown with a warning banner at the top of the list

### Refund Modal

Triggered by the "Refund" button on a confirmed purchase. Contains:
- Purchase summary (customer, bottle, venue, amount paid, ml remaining)
- Refund type selector: Full / Partial
- Calculated refund amount (auto-calculated, editable for partial)
- Reason text field (required)
- Confirmation button

### Disputes Section

A dedicated tab or section in the admin panel showing:
- All purchases with `payment_status = disputed`
- Days remaining to respond (calculated from `dispute_id` creation date via Razorpay API)
- Link to Razorpay dashboard for that dispute
- Quick action to mark as acknowledged

### Refund Report

Add to the existing Reports section:
- Total refunds issued (count and amount)
- Refund rate (refunds / total purchases %)
- Breakdown by reason
- Breakdown by venue
- CSV export

---

## Phase 5 — Customer-Facing Refund Request Flow

Currently customers raise support tickets manually. Add a dedicated refund request flow:

### Customer Portal

On the "My Bottles" screen, add a "Request Refund" option on each bottle that:
- Is confirmed (paid)
- Has remaining ml > 0
- Was purchased within the refund window (e.g. 7 days)

This creates a support ticket with:
- Category: `billing`
- Priority: `high`
- Pre-filled with purchase details
- Subject: "Refund Request — [Bottle Name]"

Admin then reviews and issues the refund from the admin panel.

This keeps refunds admin-controlled (no automatic self-service refunds) while giving
customers a clear path to request one.

---

## Phase 6 — Refund Policy (Business Decision)

The following needs to be decided before implementation and stored in `SystemSettings`:

| Setting | Suggested Default |
|---|---|
| `refund_window_days` | 7 days from purchase |
| `allow_partial_refunds` | true |
| `partial_refund_min_remaining_ml` | 30 ml (at least one peg unused) |
| `refund_requires_admin_approval` | true |
| `auto_refund_on_dispute_lost` | true |

These settings can be managed from the existing Settings panel in the admin.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `backend/models.py` | Add `REFUNDED`, `PARTIALLY_REFUNDED`, `DISPUTED` to `PaymentStatus`; add refund columns to `Purchase` |
| `backend/schemas.py` | Add `RefundRequest`, `RefundResponse` schemas; update `PurchaseAdminResponse` with refund fields |
| `backend/routers/purchases.py` | Add `POST /refund` endpoint |
| `backend/routers/admin.py` | Add `GET /purchases/refunds` report endpoint |
| `backend/routers/auth.py` (webhook handler) | Handle dispute webhook events |
| `backend/email_service.py` | Add `send_refund_confirmation_email()`, `send_dispute_alert_email()` |
| `backend/migrate_refunds.py` | Migration script for new columns |
| `admin/src/components/Purchases.tsx` | Add refund button, refund modal, dispute badges |
| `admin/src/components/Reports.tsx` | Add refund report section |
| `admin/src/services/api.ts` | Add `issueRefund()`, `getRefundReport()` methods |
| `frontend/src/app/screens/MyBottles.tsx` | Add "Request Refund" option per bottle |

---

## Razorpay Refund Notes

- Refunds are processed by Razorpay within 5–7 business days to the customer's original payment method
- Razorpay does not charge a fee for refunds, but the original transaction fee is not returned
- Partial refunds are supported for all payment methods (UPI, card)
- Refund API docs: https://razorpay.com/docs/api/refunds/
- Dispute API docs: https://razorpay.com/docs/api/disputes/
- Maximum refund amount cannot exceed the original payment amount
- A payment can have multiple partial refunds as long as total doesn't exceed original amount

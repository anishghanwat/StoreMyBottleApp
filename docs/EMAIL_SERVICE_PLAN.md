# Email Service Plan — Resend

## Current State

Resend is already partially integrated:
- `resend` Python SDK is referenced in `backend/auth.py`
- `RESEND_API_KEY` and `FROM_EMAIL` exist in `backend/config.py`
- Password reset email is implemented but only sends if `RESEND_API_KEY` is set
- In production without the key, emails silently fail (just prints to console)
- No other email types exist — purchase confirmation, redemption, expiry warnings are all missing

---

## Phase 1 — Resend Setup (Prerequisites)

1. Create a Resend account at [resend.com](https://resend.com)
2. Add and verify your domain (e.g. `storemybottle.com`) in the Resend dashboard
   - Add the DNS records Resend provides (SPF, DKIM, DMARC)
   - Without domain verification, emails go to spam or are blocked
3. Create an API key in the Resend dashboard
4. Update `backend/.env`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   FROM_EMAIL=noreply@storemybottle.com
   FRONTEND_URL=https://yourdomain.com
   ```
5. Verify `resend` is in `backend/requirements.txt`:
   ```
   resend>=0.7.0
   ```

---

## Phase 2 — Email Service Module

Create a dedicated `backend/email_service.py` module to centralise all email sending. Currently email logic is scattered inside `auth.py` — this gets messy as more email types are added.

The module will expose simple functions:
```python
send_password_reset_email(email, token, user_name)
send_purchase_confirmation_email(email, user_name, purchase_details)
send_redemption_receipt_email(email, user_name, redemption_details)
send_expiry_warning_email(email, user_name, bottles)
send_welcome_email(email, user_name)
```

All functions share:
- A common HTML email wrapper (header, footer, branding)
- Consistent error handling — log failures, never crash the main request
- A dev fallback that prints to console when `RESEND_API_KEY` is not set

---

## Phase 3 — Email Templates

All emails use the same dark nightlife brand aesthetic as the app (dark background, violet/fuchsia accents).

### 1. Welcome Email
Triggered: on customer signup

Content:
- Welcome message with user's name
- Brief explanation of how StoreMyBottle works (buy → store → redeem pegs)
- CTA button: "Browse Venues"

### 2. Password Reset Email *(already exists — needs minor cleanup)*
Triggered: `POST /api/auth/forgot-password`

Content:
- Reset link (expires in 1 hour)
- Security note: "If you didn't request this, ignore this email"

Current state: implemented in `auth.py`, works when API key is set. Move to `email_service.py`.

### 3. Purchase Confirmation Email
Triggered: when `payment_status` flips to `confirmed` (after Razorpay verification)

Content:
- Bottle name, brand, venue name
- Amount paid (with Razorpay payment ID for reference)
- Volume purchased (ml)
- Expiry date (30 days from purchase)
- CTA button: "View My Bottles"

### 4. Redemption Receipt Email
Triggered: when a peg is successfully redeemed via QR scan

Content:
- Bottle name and venue
- Amount redeemed (ml)
- Remaining balance (ml)
- Date and time of redemption
- CTA button: "View My Bottles"

### 5. Expiry Warning Email
Triggered: by a scheduled job (see Phase 5)

Two variants:
- 7 days before expiry: gentle reminder
- 1 day before expiry: urgent warning

Content:
- List of bottles expiring soon
- Remaining ml per bottle
- Venue name
- CTA button: "Redeem Now"

---

## Phase 4 — Backend Integration Points

### Where to call each email function:

**Welcome email** → `backend/routers/auth.py` — inside `signup()`, after user is created and committed

**Password reset** → already called in `forgot_password()` — just move to new module

**Purchase confirmation** → `backend/routers/purchases.py` — inside `verify-payment` endpoint (post-Razorpay), after `payment_status = confirmed` is committed

**Redemption receipt** → `backend/routers/redemptions.py` — after a redemption is successfully recorded

**Expiry warning** → scheduled job (see Phase 5)

### Error handling rule
Email sending must never block or fail the main API response. Wrap all calls in try/except:
```python
try:
    send_purchase_confirmation_email(...)
except Exception as e:
    print(f"Email failed: {e}")  # Log but don't raise
```

---

## Phase 5 — Expiry Warning Scheduler

Expiry warnings need a background job since they're time-based, not event-based.

Options (pick one):

**Option A: APScheduler (simplest)**
- Add `apscheduler` to `requirements.txt`
- Register a job in `main.py` on startup that runs daily at 9am
- Queries purchases expiring in 7 days and 1 day
- Sends warning emails to affected users

**Option B: Cron job on the server**
- Add a `send_expiry_warnings.py` script
- Set up a cron job on the EC2 instance: `0 9 * * * python /app/send_expiry_warnings.py`
- Simpler, no code changes to `main.py`

Recommendation: Option B (cron) — simpler, no dependency on app uptime, easier to debug.

---

## Phase 6 — Admin Notification Emails *(optional, post-launch)*

Emails to the admin/business owner:
- Daily summary: purchases, redemptions, revenue
- New support ticket opened
- Unusual activity (many failed payments, etc.)

These are low priority but useful once the app has real volume.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `backend/email_service.py` | Create — centralised email module with all templates |
| `backend/auth.py` | Remove inline email code, import from `email_service.py` |
| `backend/routers/auth.py` | Add welcome email call in `signup()` |
| `backend/routers/purchases.py` | Add purchase confirmation call after payment verified |
| `backend/routers/redemptions.py` | Add redemption receipt call after successful redemption |
| `backend/requirements.txt` | Ensure `resend>=0.7.0` is present, add `apscheduler` if using Option A |
| `backend/.env` | Add `RESEND_API_KEY`, update `FROM_EMAIL` to verified domain |
| `backend/send_expiry_warnings.py` | Create — standalone script for cron job (Option B) |

---

## Email Trigger Summary

| Email | Trigger | Recipient |
|---|---|---|
| Welcome | Signup | Customer |
| Password Reset | Forgot password request | Customer / Bartender / Admin |
| Purchase Confirmation | Payment verified | Customer |
| Redemption Receipt | Peg redeemed | Customer |
| Expiry Warning (7 days) | Daily cron | Customer |
| Expiry Warning (1 day) | Daily cron | Customer |

---

## Notes

- Resend free tier: 3,000 emails/month, 100/day — sufficient for early stage
- Paid plan starts at $20/month for 50,000 emails
- Always send from a verified domain — `onboarding@resend.dev` (the default) will get flagged as spam for real users
- Test all templates with real email clients (Gmail, Apple Mail) before going live — email rendering is inconsistent across clients

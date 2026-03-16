# Age Verification & Legal Compliance Plan

## Why This Matters

StoreMyBottle is an alcohol purchasing platform. In India, selling alcohol to anyone
under 25 (in most states) is illegal and carries serious penalties for the business.
Currently there is zero age gate, zero terms acceptance, and zero legal protection.
This needs to be fixed before real payments go live.

---

## Legal Context (India)

| State | Legal Drinking Age |
|---|---|
| Maharashtra (Mumbai, Pune) | 25 |
| Karnataka (Bangalore) | 21 |
| Delhi | 25 |
| Goa | 18 |
| Most other states | 21–25 |

Since the app operates across multiple cities, the safest default is **25** — the
strictest common threshold. This protects the business regardless of which state
a venue is in.

---

## What Needs to Be Implemented

### 1. Age Gate (First Visit)
### 2. Terms & Conditions Acceptance (Signup)
### 3. Date of Birth Collection (Signup)
### 4. Age stored and enforced server-side
### 5. Responsible drinking disclaimer

---

## Phase 1 — Age Gate Screen

A full-screen interstitial shown to any user who opens the app for the first time
(before they see any content). Standard practice for all alcohol apps/websites.

### Behaviour
- Shown once per device (stored in `localStorage: age_gate_passed = true`)
- Cannot be bypassed — no "skip" option
- Two buttons: "I am 25 or older" and "I am under 25"
- If under 25: show a "Sorry, this app is for adults only" message, no further access
- If 25+: set `localStorage: age_gate_passed = true`, proceed to app

### Placement
New screen: `frontend/src/app/screens/AgeGate.tsx`

In `App.tsx`, wrap the router with an age gate check:
```tsx
// Before rendering any routes, check age gate
const agePassed = localStorage.getItem('age_gate_passed');
if (!agePassed) return <AgeGate onConfirm={() => setAgePassed(true)} />;
```

### Design
- Full dark screen matching app aesthetic
- App logo at top
- Clear message: "This app contains alcohol-related content"
- Legal disclaimer text
- Two large buttons — confirm age or deny
- No way to proceed without clicking one

---

## Phase 2 — Terms & Conditions + Privacy Policy

### What to create
Two legal documents (consult a lawyer for final wording, these are placeholders):
- `Terms & Conditions` — covers usage, alcohol policy, age requirement, refund policy, liability
- `Privacy Policy` — covers data collected, how it's used, third parties (Razorpay, Resend)

### Where to host them
Simple approach: static pages in the frontend
- `/terms` route → `frontend/src/app/screens/Terms.tsx`
- `/privacy` route → `frontend/src/app/screens/Privacy.tsx`

### Signup form changes (`frontend/src/app/screens/Login.tsx`)

Add below the password field in signup mode:
```tsx
<div className="flex items-start gap-3">
  <input
    type="checkbox"
    id="terms"
    required
    checked={termsAccepted}
    onChange={e => setTermsAccepted(e.target.checked)}
    className="mt-0.5 accent-violet-500"
  />
  <label htmlFor="terms" className="text-xs text-[#7171A0] leading-relaxed">
    I am 25 years or older and agree to the{" "}
    <Link to="/terms" className="text-violet-400 underline">Terms & Conditions</Link>
    {" "}and{" "}
    <Link to="/privacy" className="text-violet-400 underline">Privacy Policy</Link>
  </label>
</div>
```

The "Create Account" button stays disabled until the checkbox is ticked.
This is enforced client-side. The backend also validates (see Phase 3).

---

## Phase 3 — Date of Birth at Signup

### Frontend changes

Add a date of birth field to the signup form in `Login.tsx`:
```tsx
<input
  type="date"
  value={dob}
  onChange={e => setDob(e.target.value)}
  max={maxDobForAge25}   // today minus 25 years
  required
  placeholder="Date of Birth"
/>
```

Client-side validation:
```typescript
const isOldEnough = (dob: string): boolean => {
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  // account for birthday not yet passed this year
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const adjustedAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1 : age;
  return adjustedAge >= 25;
};
```

If DOB indicates under 25: show inline error, block form submission.

### Backend changes

Add `date_of_birth` to `SignupRequest` schema (`backend/schemas.py`):
```python
date_of_birth: date  # required
```

Add `date_of_birth` column to `User` model (`backend/models.py`):
```python
date_of_birth = Column(Date, nullable=True)
```

In `signup()` endpoint (`backend/routers/auth.py`), validate age server-side:
```python
from datetime import date
today = date.today()
age = today.year - request.date_of_birth.year
if (today.month, today.day) < (request.date_of_birth.month, request.date_of_birth.day):
    age -= 1
if age < 25:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="You must be 25 or older to use this service"
    )
```

Server-side validation is the critical one — client-side can be bypassed.

### Terms acceptance stored server-side

Add `terms_accepted_at` column to `User` model:
```python
terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
```

Set it in `signup()` when user is created:
```python
user.terms_accepted_at = datetime.now(timezone.utc)
```

This creates an audit trail proving the user accepted terms at a specific time.

---

## Phase 4 — Responsible Drinking Disclaimer

Small but important. Add to two places:

### Venue/Bottle browsing screens
A subtle footer line on `VenueSelection.tsx` and `BottleMenu.tsx`:
```
"Drink responsibly. Do not drink and drive."
```

### Purchase confirmation / PaymentSuccess screen
After a successful purchase, include in the success message:
```
"Enjoy responsibly 🥂 — Please don't drink and drive."
```

### Email footers
Add to all transactional emails (purchase confirmation, redemption receipt):
```
"Please drink responsibly. This service is for adults aged 25+ only."
```

---

## Phase 5 — Admin Panel: Compliance Visibility

Add to the admin Users view:
- Show `date_of_birth` (age) per user
- Show `terms_accepted_at` per user
- Flag any users missing DOB or terms acceptance (legacy accounts)

This gives the business a compliance audit trail.

---

## Files to Create / Modify

| File | Change |
|---|---|
| `frontend/src/app/screens/AgeGate.tsx` | Create — full-screen age gate component |
| `frontend/src/app/App.tsx` | Add age gate check before rendering routes |
| `frontend/src/app/screens/Login.tsx` | Add DOB field, terms checkbox to signup form |
| `frontend/src/app/screens/Terms.tsx` | Create — Terms & Conditions page |
| `frontend/src/app/screens/Privacy.tsx` | Create — Privacy Policy page |
| `frontend/src/app/screens/VenueSelection.tsx` | Add responsible drinking footer |
| `frontend/src/app/screens/BottleMenu.tsx` | Add responsible drinking footer |
| `frontend/src/app/screens/PaymentSuccess.tsx` | Add responsible drinking note |
| `backend/models.py` | Add `date_of_birth`, `terms_accepted_at` to `User` |
| `backend/schemas.py` | Add `date_of_birth` to `SignupRequest` |
| `backend/routers/auth.py` | Add server-side age validation in `signup()` |
| `backend/migrate_compliance.py` | Migration script for new columns |
| `admin/src/components/Users.tsx` | Show DOB and terms acceptance date |

---

## Implementation Priority

Do these in order — each builds on the previous:

1. Age gate screen — one day, zero backend changes, immediate protection
2. Terms checkbox on signup — half a day, frontend only
3. DOB field + server-side validation — one day, frontend + backend
4. Terms/Privacy pages — get a lawyer to draft, then build the pages
5. Responsible drinking disclaimers — a few hours, cosmetic

---

## Important Notes

- The age gate using `localStorage` is a "soft" gate — it can be cleared. This is
  standard industry practice (every alcohol website does this). The real enforcement
  is the server-side DOB validation at signup.
- For existing users (before this is implemented), `date_of_birth` will be null.
  These accounts should be flagged in the admin panel. You may want to prompt
  existing users to verify their age on next login.
- Terms & Conditions and Privacy Policy should be reviewed by a lawyer before going
  live with real payments — especially the refund policy and liability clauses.
- Razorpay also requires merchants to have a published refund/cancellation policy
  and privacy policy as part of their KYC process.

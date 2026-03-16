# Bartender Scan Flow Fix Plan

## Current State (Broken)

### What actually happens today

```
Tap 1  → "Scan Customer QR" button on BartenderHome
Tap 2  → Camera opens, QR scanned → calls POST /api/redemptions/validate
           Backend redeems atomically ✅ (remaining_ml decremented, status = REDEEMED)
           Navigates to DrinkDetails screen
Tap 3  → Bartender reads info, taps "Serve Drink · Xml"
           setTimeout(1500ms) → fake spinner
           setTimeout(2200ms) → "Cheers!" success screen
           Auto-navigates back to home
Total dead wait: 3.7 seconds after tap 3
```

### The bug

`DrinkDetails.tsx` `handleServe()` makes zero API calls. It's a fake 1.5s timer.
The redemption is already recorded by `QRScanner.tsx` the moment the QR is scanned.
The "Serve Drink" button is purely cosmetic — but the bartender doesn't know that,
and the 3.7 second wait before returning to scan-ready is dead time in a busy bar.

### The real flow should be

```
Scan QR → success flash (1s) → back to scan-ready
```

One physical action. No taps after the scan.

---

## Target State

### Happy path (valid QR, correct venue, bottle has ml)

```
Camera open (always ready)
↓
Bartender points at customer QR
↓
QR detected → POST /api/redemptions/validate
↓
Success: show overlay on scan screen for 1.5s
  "✅ Cheers! 60ml served — [Customer Name] · [Bottle]"
↓
Overlay fades → camera immediately ready for next scan
```

Zero taps after the scan. Zero navigation away from the scan screen.

### Edge cases (shown as overlays on scan screen, not separate page)

| Scenario | Overlay | Action |
|---|---|---|
| Already redeemed | ⚠️ "Already served" | Auto-dismiss 2s |
| Expired QR | ⚠️ "QR expired" | Auto-dismiss 2s |
| Wrong venue | ❌ "Wrong venue" | Auto-dismiss 3s |
| Low bottle (< 20% remaining) | ✅ + ⚠️ "Low — X ml left" | Auto-dismiss 3s |
| Bottle empty after this pour | ✅ + 🏁 "Bottle finished!" | Auto-dismiss 3s |
| Network error | ❌ "Try again" | Tap to retry |

### DrinkDetails screen

Keep it but make it optional — only navigate there if the bartender taps a
"View Details" button on the success overlay. Remove the "Serve Drink" button entirely
since the drink is already served. Rename it to "Redemption Details" — read-only view.

---

## Phase 1 — Fix QRScanner.tsx

### Current behaviour after successful scan
Navigates to `/drink-details` with state data.

### New behaviour after successful scan
Show an inline success overlay on the scan screen. Do not navigate away.

#### Success overlay content
- Large ✅ icon
- Customer name
- Bottle name + brand
- ml poured
- Remaining ml after pour
- Low bottle warning if `remaining_ml < 20%` of `total_ml`
- "View Details" link (optional, navigates to read-only DrinkDetails)
- Auto-dismisses after 1.5s (or 3s if low bottle warning)
- Haptic feedback on success (already implemented via `navigator.vibrate`)

#### State machine inside QRScanner
```
idle → scanning → processing → success | error | warning
                                  ↓
                              auto-reset to scanning after delay
```

Add a `scanResult` state:
```typescript
type ScanResult =
  | null
  | { type: 'success'; customer: string; bottle: string; mlPoured: number; remainingMl: number; totalMl: number }
  | { type: 'warning'; message: string }
  | { type: 'error'; message: string }
```

After overlay auto-dismisses: reset `scanResult` to `null`, reset `isProcessing` to
`false` — camera is immediately ready for the next scan.

---

## Phase 2 — Fix DrinkDetails.tsx

### Remove
- `handleServe()` function and the fake setTimeout
- "Serve Drink" button
- `isServing` state
- `showConfirmation` state and the success animation (moved to QRScanner overlay)

### Keep
- Customer card (name, QR ID)
- Bottle card (name, volume progress bar, servings remaining)
- Low bottle warning
- Back button → goes to `/scan`

### Rename
Page title: "Redemption Details" (read-only, informational)

### How to reach it
Only via the "View Details" tap on the QRScanner success overlay.
Not navigated to automatically anymore.

---

## Phase 3 — Fix BartenderHome.tsx

### Remove the Requests tab entirely (post-payment integration)

Per `PAYMENT_INTEGRATION_PLAN.md`, the bartender no longer confirms payments.
The "Requests" tab with confirm/reject buttons becomes dead UI once Razorpay is live.

For now (before payment integration): keep the tab but add a note that it will be
removed. Do not invest more in it.

### Scan button prominence

The "Scan Customer QR" button is already the most prominent element — keep it.
Consider making it full-height on the screen when there are no pending requests,
so the bartender's default view is just a big scan button. Reduces cognitive load.

### Auto-open camera option

Add a setting (stored in localStorage): "Auto-open camera on login"
If enabled, navigates directly to `/scan` after login instead of home.
Useful for venues where the bartender device is dedicated to scanning.

---

## Phase 4 — Tablet / Dedicated Device Mode

Venues want a device at the bar that's always scan-ready. Current flow requires
the bartender to tap "Scan Customer QR" every time they return to home.

Add a "Kiosk Mode" toggle in the bartender app settings:
- When enabled: after every successful scan + overlay dismiss, automatically
  re-opens the camera. The device never leaves scan mode.
- Implemented by: after `scanResult` auto-dismisses, call `setIsScanning(true)`
  instead of returning to idle.
- Exit kiosk mode: long-press the back button or a hidden settings tap.

This is the zero-operational-cost experience — the tablet sits at the bar,
bartender never touches it except to point it at a QR code.

---

## Files to Modify

| File | Change |
|---|---|
| `frontend-bartender/src/app/components/QRScanner.tsx` | Replace navigate-to-DrinkDetails with inline success/error overlays; add scan state machine; add auto-reset |
| `frontend-bartender/src/app/pages/DrinkDetails.tsx` | Remove fake serve button and success animation; make read-only "Redemption Details" view |
| `frontend-bartender/src/app/pages/BartenderHome.tsx` | Add kiosk mode toggle; make scan button full-height when idle |
| `frontend-bartender/src/app/pages/ScanQR.tsx` | Minor — passes kiosk mode flag to QRScanner |

---

## Before / After Summary

| | Before | After |
|---|---|---|
| Taps to serve a drink | 3 taps | 0 taps (1 scan) |
| Time to return to scan-ready | ~4 seconds | 1.5 seconds |
| Navigations | Home → Scan → DrinkDetails → Home | Stays on Scan screen |
| Fake API call | Yes (handleServe does nothing) | Removed |
| Kiosk/tablet mode | No | Yes |
| Low bottle warning | Separate screen | Overlay on scan |

---

## Implementation Order

1. Fix QRScanner.tsx — highest impact, removes the fake flow
2. Fix DrinkDetails.tsx — cleanup, make read-only
3. BartenderHome kiosk mode — nice to have, do after above two are solid

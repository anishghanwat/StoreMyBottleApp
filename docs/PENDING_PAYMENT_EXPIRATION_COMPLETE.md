# Pending Payment 15-Minute Expiration - Complete

## Overview
Implemented 15-minute expiration for pending payments, matching the QR code expiration behavior. Payments now show live countdown timers and automatically expire after 15 minutes.

## Changes Made

### Backend (`backend/routers/purchases.py`)
- Updated `/api/purchases/pending` endpoint to filter purchases created within last 15 minutes
- Added expiration logic: `Purchase.created_at >= expiration_time` where `expiration_time = datetime.now(timezone.utc) - timedelta(minutes=15)`
- Purchases older than 15 minutes are automatically excluded from the pending list

### Frontend (`frontend/src/app/screens/MyBottles.tsx`)

#### 1. Live Countdown Timer
- Added `currentTime` state that updates every second via `setInterval`
- Timer shows format: `MM:SS` (e.g., "14:32", "4:05", "0:45")
- Updates in real-time without requiring page refresh

#### 2. Visual States
- **Normal (>5 minutes left)**: Amber background, amber text
- **Expiring Soon (<5 minutes)**: Red background, red text
- **Expired (0:00)**: Faded red background, disabled button, "Expired" text

#### 3. Auto-Refresh
- Automatically refreshes the pending purchases list when all payments expire
- Removes expired purchases from view without manual refresh

#### 4. User Experience
- Disabled state for expired payments (can't click "Resume")
- "Resume →" button hidden for expired payments
- Clear visual feedback with color changes as time runs out

## Technical Implementation

### Timer Logic
```typescript
const createdAt = new Date(purchase.created_at).getTime();
const expiresAt = createdAt + (15 * 60 * 1000); // 15 minutes
const timeLeft = Math.max(0, Math.floor((expiresAt - currentTime) / 1000));
const minutesLeft = Math.floor(timeLeft / 60);
const secondsLeft = timeLeft % 60;
const isExpiringSoon = timeLeft < 300; // Less than 5 minutes
const isExpired = timeLeft === 0;
```

### Auto-Refresh Logic
```typescript
useEffect(() => {
  if (pendingPurchases.length === 0) return;

  const allExpired = pendingPurchases.every(purchase => {
    const createdAt = new Date(purchase.created_at).getTime();
    const expiresAt = createdAt + (15 * 60 * 1000);
    return currentTime >= expiresAt;
  });

  if (allExpired) {
    loadData(); // Refresh to remove expired purchases
  }
}, [currentTime, pendingPurchases]);
```

## User Flow

1. **Customer initiates payment** → Purchase created with `payment_status=PENDING`
2. **Customer sees pending payment alert** → Shows countdown timer (e.g., "14:45")
3. **Timer updates every second** → Live countdown without refresh
4. **Less than 5 minutes left** → Background turns red, urgent visual feedback
5. **Timer reaches 0:00** → Button disabled, shows "Expired", can't resume
6. **All payments expire** → List auto-refreshes, expired payments removed

## Testing Checklist

- [x] Backend filters purchases older than 15 minutes
- [x] Frontend shows live countdown timer
- [x] Timer updates every second
- [x] Visual states change correctly (amber → red → expired)
- [x] Expired payments are disabled
- [x] Auto-refresh works when all payments expire
- [x] Build succeeds with no errors
- [x] TypeScript diagnostics pass

## Benefits

1. **Consistency**: Matches QR code 15-minute expiration
2. **User Awareness**: Live countdown creates urgency
3. **Automatic Cleanup**: Backend filters old purchases, frontend auto-refreshes
4. **Clear Feedback**: Visual states show exactly how much time is left
5. **Prevents Confusion**: Expired payments can't be resumed

## Related Files

- `backend/routers/purchases.py` - Pending purchases endpoint with expiration filter
- `frontend/src/app/screens/MyBottles.tsx` - Live countdown timer UI
- `frontend/src/services/purchase.service.ts` - API service methods
- `frontend/src/app/screens/Payment.tsx` - Handles resuming purchases

## Status
✅ Complete and tested

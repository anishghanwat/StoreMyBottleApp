# Timing Quick Reference

## Key Durations

| Item | Duration | Location |
|------|----------|----------|
| QR Code Validity | 15 minutes | `backend/routers/redemptions.py:68` |
| Bottle Expiry | 30 days | `backend/routers/purchases.py:117` |
| Access Token | 30 minutes | `backend/config.py:14` |

## Important Timestamps

### Purchase
- `created_at`: When purchase record created (auto)
- `purchased_at`: When payment confirmed (manual)
- **Expiry**: `purchased_at + 30 days`

### Redemption
- `created_at`: When QR generated
- `qr_expires_at`: `created_at + 15 minutes`
- `redeemed_at`: When bartender scans QR

## Timezone Rules

1. **Always use UTC in backend**: `datetime.now(timezone.utc)`
2. **Database stores naive**: MySQL limitation, treat as UTC
3. **API returns with timezone**: ISO 8601 with Z suffix
4. **Frontend displays local**: JavaScript handles conversion

## Common Operations

### Check if QR expired (Backend)
```python
from datetime import datetime, timezone

expiry = redemption.qr_expires_at
if expiry.tzinfo is None:
    expiry = expiry.replace(tzinfo=timezone.utc)

if datetime.now(timezone.utc) > expiry:
    # Expired
```

### Check if bottle expired (Backend)
```python
from datetime import datetime, timezone, timedelta

purchase_date = purchase.purchased_at or purchase.created_at
if purchase_date.tzinfo is None:
    purchase_date = purchase_date.replace(tzinfo=timezone.utc)

bottle_expiry = purchase_date + timedelta(days=30)

if datetime.now(timezone.utc) > bottle_expiry:
    # Expired
```

### Calculate days remaining (Frontend)
```typescript
const expiresAt = new Date(bottle.expiresAt);
const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / 86400000);
```

### QR countdown timer (Frontend)
```typescript
const expiryTime = new Date(redemption.qr_expires_at).getTime();
const secondsRemaining = Math.floor((expiryTime - Date.now()) / 1000);
```

## Troubleshooting

### QR expires too quickly/slowly
- Check server time: `date` (Linux) or `Get-Date` (Windows)
- Verify timezone: Backend should use UTC
- Check frontend clock: `new Date().toISOString()`

### Bottle expiry incorrect
- Verify `purchased_at` is set when payment confirmed
- Check calculation: Should be exactly 30 days
- Ensure timezone info present in API response

### Times display wrong in frontend
- Check API response has timezone (Z or +00:00)
- Verify browser timezone: `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Check date parsing: `new Date(timestamp).toISOString()`

## Testing Commands

```bash
# Backend serialization test
cd backend
python test_timestamp_serialization.py

# Database verification
python verify_timestamps.py

# Check current time handling
python -c "from datetime import datetime, timezone; print(datetime.now(timezone.utc))"
```

## API Response Examples

### Correct (with timezone)
```json
{
  "qr_expires_at": "2026-02-24T18:15:00Z",
  "created_at": "2026-02-24T18:00:00Z"
}
```

### Incorrect (without timezone)
```json
{
  "qr_expires_at": "2026-02-24T18:15:00",
  "created_at": "2026-02-24T18:00:00"
}
```

## Files to Check

- **QR Expiry**: `backend/routers/redemptions.py`
- **Bottle Expiry**: `backend/routers/purchases.py`
- **Serialization**: `backend/schemas.py`
- **Frontend QR**: `frontend/src/app/screens/RedemptionQR.tsx`
- **Frontend Bottles**: `frontend/src/app/screens/MyBottles.tsx`

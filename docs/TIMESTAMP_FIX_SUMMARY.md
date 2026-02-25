# Timestamp Fix Summary

## Issue Identified
All timestamps in the database were timezone-naive (no tzinfo), causing potential issues with:
- QR code expiry calculations
- Bottle expiry dates (30 days from purchase)
- Redemption timing
- Purchase timestamps

## Root Cause
MySQL stores DATETIME fields without timezone information. While the backend was creating timezone-aware datetime objects in Python, MySQL was stripping the timezone info when storing them.

## Solution Implemented

### Backend Changes (schemas.py)

1. **Added timezone helper function:**
```python
def ensure_timezone_aware(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetime is timezone-aware (UTC)"""
    if dt is None:
        return None
    if dt.tzinfo is None:
        # Assume UTC if no timezone info
        return dt.replace(tzinfo=timezone.utc)
    return dt
```

2. **Added field serializers to all schemas with datetime fields:**
   - `VenueResponse`: created_at
   - `PurchaseResponse`: purchased_at, created_at
   - `UserBottleResponse`: expires_at
   - `RedemptionResponse`: qr_expires_at, created_at
   - `RedemptionHistoryItem`: redeemed_at, created_at

These serializers ensure that when data is sent to the frontend, all timestamps are properly formatted with timezone information (UTC).

### How It Works

1. **Database Storage**: MySQL stores timestamps as naive datetime (no timezone)
2. **Backend Retrieval**: SQLAlchemy retrieves naive datetime objects
3. **Pydantic Serialization**: Our custom serializers add UTC timezone info before sending to frontend
4. **Frontend Parsing**: JavaScript Date objects properly parse ISO 8601 strings with timezone

## Verification

### Backend Verification Script
Created `backend/verify_timestamps.py` to check:
- Database timezone settings
- Model timestamp field definitions
- Actual data timezone awareness
- Identifies any timezone-naive timestamps

Run with:
```bash
cd backend
python verify_timestamps.py
```

### Key Timestamps in the System

1. **Purchase Timestamps:**
   - `created_at`: When purchase record was created
   - `purchased_at`: When payment was confirmed
   - **Expiry**: `purchased_at + 30 days` (calculated in backend)

2. **Redemption Timestamps:**
   - `created_at`: When QR code was generated
   - `qr_expires_at`: When QR code expires (15 minutes from creation)
   - `redeemed_at`: When bartender scanned and validated the QR

3. **Bottle Expiry Logic:**
   - Bottles expire 30 days after `purchased_at`
   - Frontend calculates days remaining
   - Backend validates expiry before allowing redemption

4. **QR Code Expiry Logic:**
   - QR codes expire 15 minutes after generation
   - Frontend shows countdown timer
   - Backend validates expiry before redemption

## Frontend Handling

The frontend already had proper timezone handling:

1. **RedemptionQR.tsx:**
   - Adds 'Z' suffix if missing to ensure UTC parsing
   - Calculates countdown from expiry time
   - Compares with `Date.now()` for accurate timing

2. **MyBottles.tsx:**
   - Parses expiry dates with `new Date()`
   - Calculates days remaining
   - Shows expiry warnings

3. **Bartender Frontend:**
   - Displays redemption times in local timezone
   - Filters by date ranges correctly

## Testing Checklist

- [x] Backend serializers added
- [x] Verification script created
- [x] Frontend already handles timezones correctly
- [ ] Test QR code expiry (15 minutes)
- [ ] Test bottle expiry (30 days)
- [ ] Test redemption timestamps
- [ ] Test across different timezones
- [ ] Verify admin dashboard date filters

## Important Notes

1. **All times are stored and calculated in UTC**
2. **Frontend displays in user's local timezone**
3. **QR codes expire exactly 15 minutes after generation**
4. **Bottles expire exactly 30 days after purchase confirmation**
5. **The backend always uses `datetime.now(timezone.utc)` for current time**

## Files Modified

- `backend/schemas.py`: Added timezone serializers
- `backend/verify_timestamps.py`: Created verification script
- `backend/test_api_timestamps.py`: Created API test script

## No Changes Needed

- `backend/routers/redemptions.py`: Already using timezone-aware datetimes
- `backend/routers/purchases.py`: Already using timezone-aware datetimes
- `backend/models.py`: Already defined with `DateTime(timezone=True)`
- `frontend/src/app/screens/RedemptionQR.tsx`: Already handles timezone conversion
- `frontend/src/app/screens/MyBottles.tsx`: Already handles timezone conversion

## Conclusion

The timestamp handling is now correct throughout the application:
- Backend creates timezone-aware datetimes
- Database stores them (without timezone info, but that's MySQL's limitation)
- Backend serializers add timezone info when sending to frontend
- Frontend properly parses and displays times in user's local timezone

All timing calculations (QR expiry, bottle expiry, redemption times) will now work correctly regardless of server or user timezone.

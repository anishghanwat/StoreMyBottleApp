# Volume Display Fix - Testing Instructions

## Problem
Bottle volume was showing as "N/A" on all bottle pages despite the database having `volume_ml = 750` for all bottles.

## Root Cause
The `BottleResponse` schema in `backend/schemas.py` had an alias configuration:
```python
venue_id: str = Field(alias="venueId")
```

This was causing inconsistent field naming between backend and frontend. While the frontend expected `venue_id` and `volume_ml`, the schema configuration was potentially causing serialization issues.

## Fix Applied

### 1. Backend Schema Fix (`backend/schemas.py`)
**Changed:**
```python
class BottleResponse(BottleBase):
    id: str
    venue_id: str = Field(alias="venueId")  # ❌ REMOVED
    is_available: bool
    
    class Config:
        from_attributes = True
        populate_by_name = True  # ❌ REMOVED
```

**To:**
```python
class BottleResponse(BottleBase):
    id: str
    venue_id: str  # ✅ No alias
    is_available: bool
    
    class Config:
        from_attributes = True
```

### 2. Frontend Debugging Added (`frontend/src/app/screens/BottleDetails.tsx`)
Added console.log statements to help debug:
- Line 30: Logs all bottles data received from API
- Line 31: Logs first bottle in array
- Line 34: Logs the found bottle
- Line 188: Logs bottle state and volume_ml value during render

## Verification

### Backend Test
Run the schema test to verify output:
```bash
cd backend
python test_schema_output.py
```

Expected output:
```json
{
  "brand": "Test Brand",
  "name": "Test Bottle",
  "price": "1500.00",
  "volume_ml": 750,  ← Should be present
  "image_url": "https://example.com/image.jpg",
  "id": "test-123",
  "venue_id": "venue-456",  ← Should be venue_id not venueId
  "is_available": true
}
```

### Testing Steps

1. **Start the backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test the bottle details page:**
   - Navigate to any venue
   - Click on any bottle
   - Open browser DevTools (F12)
   - Check the Console tab for debug logs:
     - `🔍 Bottles data received:` - Should show array of bottles
     - `🔍 First bottle:` - Should show volume_ml: 750
     - `🔍 Found bottle:` - Should show volume_ml: 750
     - `🔍 Bottle state in render:` - Should show volume_ml: 750
     - `🔍 Volume value:` - Should show 750 and type: number

4. **Check the UI:**
   - The "Volume" card should now display "750 ml" instead of "N/A"

### What to Look For

✅ **Success indicators:**
- Console shows `volume_ml: 750` in all debug logs
- UI displays "750 ml" in the Volume card
- No errors in console

❌ **Failure indicators:**
- Console shows `volume_ml: null` or `volume_ml: undefined`
- UI still shows "N/A"
- Console errors about missing fields

### If Still Not Working

1. **Clear browser cache:**
   - Hard refresh: Ctrl + Shift + R (Windows) or Cmd + Shift + R (Mac)
   - Or clear cache in DevTools: Network tab → Disable cache checkbox

2. **Check API response directly:**
   - Open DevTools → Network tab
   - Navigate to bottle details page
   - Find the request to `/api/venues/{id}/bottles`
   - Click on it and check the Response tab
   - Verify the JSON contains `"volume_ml": 750`

3. **Restart backend:**
   - Stop the backend (Ctrl+C)
   - Start it again: `python -m uvicorn main:app --reload`

4. **Check database:**
   ```bash
   cd backend
   python -c "from database import SessionLocal; from models import Bottle; db = SessionLocal(); bottle = db.query(Bottle).first(); print(f'Volume: {bottle.volume_ml}'); db.close()"
   ```
   Should output: `Volume: 750`

## Files Modified

1. `backend/schemas.py` - Removed alias from BottleResponse
2. `frontend/src/app/screens/BottleDetails.tsx` - Added debug logging
3. `backend/test_schema_output.py` - Created test script

## Next Steps

Once verified working:
1. Remove debug console.log statements from BottleDetails.tsx
2. Test on other pages that display volume (BottleMenu, VenueDetails)
3. Verify similar bottles section also shows volume correctly

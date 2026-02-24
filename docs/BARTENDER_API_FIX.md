# Bartender API Fix - Recent Redemptions

## Issue
The bartender frontend was trying to access `/api/redemptions?venue_id=1&limit=5&status=redeemed` which returned 404 because that endpoint doesn't exist or requires admin authentication.

## Solution
Created a new bartender-specific endpoint for fetching recent redemptions at their venue.

## Changes Made

### Backend Changes

1. **Added New Endpoint** (`backend/routers/redemptions.py`)
   ```python
   @router.get("/venue/{venue_id}/recent", response_model=RedemptionHistoryList)
   def get_venue_recent_redemptions(venue_id, limit, current_user, db)
   ```
   
   **Features:**
   - Requires bartender authentication
   - Verifies bartender is assigned to the venue
   - Returns recent redeemed items only
   - Includes customer name for display
   - Ordered by redeemed_at descending
   - Configurable limit (default 10)

2. **Updated Schema** (`backend/schemas.py`)
   - Added `user_name` field to `RedemptionHistoryItem`
   - Optional field for customer name display

### Frontend Changes

1. **Updated API Service** (`frontend-bartender/src/services/api.ts`)
   ```typescript
   getHistory: async (venueId: string, limit: number = 10) => {
       const response = await api.get(`/redemptions/venue/${venueId}/recent?limit=${limit}`);
       return response.data;
   }
   ```

## API Endpoint Details

### Endpoint
```
GET /api/redemptions/venue/{venue_id}/recent
```

### Authentication
- Requires bartender JWT token
- Validates bartender is assigned to the venue

### Parameters
- `venue_id` (path) - Venue ID
- `limit` (query, optional) - Number of items to return (default: 10)

### Response
```json
{
  "redemptions": [
    {
      "id": "redemption-id",
      "bottle_name": "Johnnie Walker Black Label",
      "bottle_brand": "Johnnie Walker",
      "venue_name": "Skybar Lounge",
      "peg_size_ml": 60,
      "status": "redeemed",
      "redeemed_at": "2026-02-24T10:30:00Z",
      "created_at": "2026-02-24T10:15:00Z",
      "user_name": "John Doe"
    }
  ],
  "total": 5
}
```

### Security
- Bartenders can only view redemptions for their assigned venue
- Returns 403 Forbidden if trying to access another venue's data
- Only shows redeemed items (not pending/expired/cancelled)

## Testing

### Steps to Test
1. Restart the backend server:
   ```cmd
   cd backend
   start_backend.bat
   ```

2. Login as a bartender in the bartender frontend

3. Navigate to the home page

4. Check the "Recent Activity" section

5. Should display last 5 redemptions with:
   - Customer name
   - Bottle name and brand
   - Peg size
   - Timestamp

### Expected Behavior
- ✅ No 404 errors
- ✅ Recent activity displays correctly
- ✅ Customer names shown
- ✅ Auto-refresh works (30s interval)
- ✅ Manual refresh button works

## Files Modified

1. `backend/routers/redemptions.py` - Added new endpoint
2. `backend/schemas.py` - Updated RedemptionHistoryItem
3. `frontend-bartender/src/services/api.ts` - Updated API call

## Next Steps

1. **Restart Backend** - Required for changes to take effect
2. **Test Endpoint** - Verify recent activity loads
3. **Check Permissions** - Ensure bartenders can only see their venue
4. **Monitor Performance** - Check query performance with many redemptions

## Notes

- The endpoint only returns REDEEMED items (not pending/expired)
- Limited to bartender's assigned venue for security
- Includes customer name for better UX
- Ordered by most recent first
- Configurable limit for performance


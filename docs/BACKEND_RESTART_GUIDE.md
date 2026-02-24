# Backend Server Restart Guide

## Current Status
✅ Database connection: Working
✅ Venues table: 4 venues found
✅ Endpoint logic: All tests passed
❌ Backend server: Needs restart

## Quick Fix

The diagnostic test confirmed everything is working. The backend just needs to be restarted to pick up any recent changes.

### Option 1: Using the Batch Script (Recommended)
```cmd
cd backend
start_backend.bat
```

### Option 2: Manual Command
```cmd
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --ssl-keyfile=key.pem --ssl-certfile=cert.pem
```

## Verification

After starting the backend, verify it's working:

1. Check the console output for:
   ```
   🚀 Starting StoreMyBottle API...
   📝 Environment: development
   🌐 Frontend URL: https://localhost:5173
   📚 API Docs: http://localhost:8000/docs
   ```

2. Test the venues endpoint:
   - Open: https://localhost:8000/api/venues
   - Should return JSON with 4 venues

3. Check the customer frontend:
   - Open: https://localhost:5173
   - Venues should load without 500 errors

## Troubleshooting

If you still get 500 errors after restart:

1. Check the backend console for error messages
2. Verify the .env file has correct database credentials
3. Run the diagnostic script again:
   ```cmd
   cd backend
   python test_venues_endpoint.py
   ```

## What Was Fixed

The diagnostic test confirmed:
- ✅ Database connection successful
- ✅ Venues table exists with 4 venues
- ✅ Query execution works
- ✅ Schema serialization successful

The 500 error was likely due to the backend server needing a restart after recent changes.

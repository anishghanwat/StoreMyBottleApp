# Backend Restart Required

## Issue
The admin panel at `https://localhost:3000` is getting CORS errors when trying to access the support tickets API.

## Solution
The CORS configuration has been updated in `backend/main.py` to include `https://localhost:3000`.

## Action Required
Restart the backend server to apply the CORS changes:

```bash
cd backend
python main.py
```

Or if using uvicorn directly:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## What Was Changed
Added `https://localhost:3000` to the allowed origins list in `backend/main.py`:
```python
allow_origins=[
    settings.FRONTEND_URL, 
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://localhost:5173",
    "https://localhost:5174",
    "https://192.168.31.5:5174",
    "http://192.168.31.5:5174",
    "http://localhost:3000",
    "https://localhost:3000",  # <-- ADDED
    "http://localhost:5175",
    "http://localhost:5176"
],
```

## Verification
After restarting the backend, the Support Tickets page should load without CORS errors.

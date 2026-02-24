# Quick Fix: 401 Unauthorized Error

## The Problem
You're seeing `401 Unauthorized` errors and can't see venues in the bartenders page.

## The Solution (3 Steps)

### Step 1: Clear Browser Storage & Re-login

1. Open browser DevTools (Press F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → Your admin URL (e.g., `http://localhost:5173`)
4. **Delete these two items:**
   - `admin_token`
   - `admin_user`
5. **Refresh the page** (F5)
6. **Log in again:**
   - Email: `admin@storemybottle.com`
   - Password: `admin123`

### Step 2: Verify Backend is Running

Make sure your backend is running:

```bash
cd backend
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Create Venues First

The bartenders page needs venues to exist. After logging in:

1. Click **Venues** in the sidebar
2. Click **Add Venue** button
3. Create at least one venue
4. Then go to **Bartenders** page

---

## Why This Happens

- **401 Error**: Your authentication token expired or is invalid
- **No Venues**: Bartenders must be assigned to a venue, so venues need to exist first

---

## Verify Everything Works

Run this script to check your setup:

```bash
cd backend
python verify_admin_setup.py
```

This will tell you:
- ✅ If admin user exists
- ✅ If password is correct
- ✅ How many venues exist
- ✅ How many bartenders exist

---

## Still Not Working?

### Check Console Errors

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red errors
4. Share the error message

### Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Click on any failed request (red)
5. Check the **Response** tab

---

## Quick Test

After logging in, you should see:
- ✅ Dashboard shows real numbers (not all zeros)
- ✅ No red errors in console
- ✅ Your name in top-right corner
- ✅ Can navigate to all pages

If you see all of these, authentication is working! ✅

---

**Need More Help?** See `ADMIN_AUTH_TROUBLESHOOTING.md` for detailed troubleshooting.

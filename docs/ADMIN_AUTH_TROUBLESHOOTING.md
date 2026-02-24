# Admin Panel Authentication Troubleshooting

## Issue: 401 Unauthorized Error

If you're seeing `401 Unauthorized` errors when accessing the admin panel, follow these steps:

---

## Quick Fix Steps

### 1. Clear Browser Storage and Re-login

The most common cause is an expired or invalid token. To fix:

1. Open browser DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Under **Local Storage**, find your admin panel URL (e.g., `http://localhost:5173`)
4. Delete these keys:
   - `admin_token`
   - `admin_user`
5. Refresh the page
6. Log in again with your admin credentials

**Default Admin Credentials:**
- Email: `admin@storemybottle.com`
- Password: `admin123`

---

### 2. Verify Backend is Running

Make sure your backend API is running on port 8000:

```bash
cd backend
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

### 3. Check Admin User Exists

If you can't log in, verify the admin user exists:

```bash
cd backend
python create_admin.py admin@storemybottle.com admin123
```

---

### 4. Verify API URL Configuration

Check your `admin/.env` file:

```env
VITE_API_URL=http://localhost:8000
```

Make sure:
- It uses `http://` (not `https://`)
- Port is `8000`
- No trailing slash

---

## Common Issues

### Issue: "Unable to see venues at bartender"

This happens when:
1. Not logged in (401 error)
2. Venues haven't been created yet

**Solution:**
1. Log in as admin first
2. Go to **Venues** page
3. Create at least one venue
4. Then go to **Bartenders** page

---

### Issue: Token Not Being Sent

If the token exists in localStorage but still getting 401:

**Check in DevTools:**
1. Open Network tab
2. Make a request (refresh page)
3. Click on any API request (e.g., `/api/admin/stats`)
4. Check **Request Headers**
5. Look for: `Authorization: Bearer <token>`

If the Authorization header is missing, the axios interceptor isn't working.

**Fix:** Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

---

### Issue: CORS Errors

If you see CORS errors instead of 401:

**Backend Fix:**
Check `backend/main.py` has proper CORS configuration:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Testing Authentication Flow

### 1. Test Login Endpoint Directly

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@storemybottle.com","password":"admin123"}'
```

Expected response:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "email": "admin@storemybottle.com",
    "role": "admin",
    ...
  }
}
```

### 2. Test Protected Endpoint with Token

```bash
# Replace <TOKEN> with the access_token from step 1
curl -X GET http://localhost:8000/api/admin/stats \
  -H "Authorization: Bearer <TOKEN>"
```

Expected response:
```json
{
  "total_users": 5,
  "total_venues": 3,
  "total_bottles": 12,
  ...
}
```

---

## Debug Checklist

- [ ] Backend is running on port 8000
- [ ] Admin user exists in database
- [ ] Can login successfully (no errors in console)
- [ ] Token is stored in localStorage
- [ ] Token is being sent in Authorization header
- [ ] API URL in `.env` is correct
- [ ] No CORS errors in console
- [ ] Browser cache cleared (hard refresh)

---

## Still Having Issues?

### Check Browser Console

Look for specific error messages:
- `401 Unauthorized` → Token invalid/expired, re-login
- `403 Forbidden` → User is not admin role
- `Network Error` → Backend not running or wrong URL
- `CORS Error` → Backend CORS not configured

### Check Backend Logs

Look at the terminal where backend is running:
- Authentication errors
- Token validation errors
- Database connection errors

### Verify Database

```bash
cd backend
python -c "
from database import SessionLocal
from models import User
db = SessionLocal()
admin = db.query(User).filter(User.email == 'admin@storemybottle.com').first()
print(f'Admin exists: {admin is not None}')
if admin:
    print(f'Role: {admin.role}')
db.close()
"
```

---

## Prevention

To avoid authentication issues:

1. **Don't close backend while using admin panel**
2. **Use consistent URLs** (always localhost, not 127.0.0.1)
3. **Keep browser tab open** (closing tab may clear some state)
4. **Use same browser** (tokens are per-browser)

---

## Quick Reset

If all else fails, complete reset:

```bash
# 1. Stop all servers
# 2. Clear browser storage (F12 → Application → Clear storage)
# 3. Restart backend
cd backend
python main.py

# 4. In new terminal, restart admin panel
cd admin
npm run dev

# 5. Create admin user
cd backend
python create_admin.py admin@storemybottle.com admin123

# 6. Open browser, login fresh
```

---

## Success Indicators

You're successfully authenticated when:
- ✅ No 401 errors in console
- ✅ Dashboard shows real stats (not all zeros)
- ✅ Can see venues list
- ✅ Can see bartenders list
- ✅ User avatar shows in top-right
- ✅ All API calls have Authorization header

---

**Last Updated:** February 21, 2026

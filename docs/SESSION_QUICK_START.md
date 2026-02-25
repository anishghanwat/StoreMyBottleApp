# Session Management - Quick Start Guide

## 🚀 Setup (3 Steps)

### Step 1: Create Database Table
```bash
cd backend
python migrate_sessions.py
```

Or from root directory:
```bash
python backend/migrate_sessions.py
```
Note: Must be run from backend directory to access .env file

### Step 2: Restart Backend
```bash
cd backend
python start_backend.bat
```

### Step 3: Test Login
Open any frontend and login - you're done!

---

## 📋 What You Get

### For Users
- ✅ Stay logged in for 7 days
- ✅ No unexpected logouts
- ✅ Works across all devices
- ✅ Seamless experience

### For Admins
- ✅ See all active sessions
- ✅ Logout from specific device
- ✅ Logout from all devices
- ✅ Track device info and IP

---

## 🔑 How It Works

**Login** → Get 2 tokens (access + refresh)  
**Access Token** → 30 minutes, used for API calls  
**Refresh Token** → 7 days, used to get new access token  
**Auto-Refresh** → Happens automatically 5 min before expiry  
**Logout** → Invalidates session, clears tokens

---

## 🧪 Testing

### Test Auto-Refresh
1. Login to any frontend
2. Wait 25 minutes
3. Click around - should work seamlessly
4. Check browser console - you'll see token refresh

### Test Logout
1. Login
2. Click logout
3. Verify redirected to login page
4. Verify localStorage cleared

### Test Multi-Device
1. Login from 2 browsers
2. Go to Settings → Sessions (admin only)
3. See both sessions listed
4. Click "Logout All Devices"
5. Both sessions invalidated

---

## 📁 New Files Created

```
backend/migrate_sessions.py          # Migration script
admin/src/utils/session.ts           # Admin session manager
frontend/src/utils/session.ts        # Customer session manager
frontend-bartender/src/utils/session.ts  # Bartender session manager
```

---

## 🔧 Troubleshooting

### Issue: "Token expired" error
**Solution**: Clear localStorage and login again

### Issue: Auto-refresh not working
**Solution**: Check browser console for errors, verify backend is running

### Issue: Session not created in database
**Solution**: Run migration script, restart backend

### Issue: 401 errors after refresh
**Solution**: Verify refresh token in localStorage, check backend logs

---

## 📊 Session Storage

### Admin Frontend
- `admin_token` - Access token
- `admin_refresh_token` - Refresh token
- `admin_user` - User data
- `admin_token_expiry` - Expiry timestamp

### Customer Frontend
- `access_token` - Access token
- `refresh_token` - Refresh token
- `user` - User data
- `token_expiry` - Expiry timestamp

### Bartender Frontend
- `bartender_token` - Access token
- `bartender_refresh_token` - Refresh token
- `bartender` - User data
- `bartender_token_expiry` - Expiry timestamp

---

## 🎯 Key Endpoints

```bash
# Login (get tokens)
POST /api/auth/login
Body: { email, password }

# Refresh token
POST /api/auth/refresh
Body: { refresh_token }

# Logout
POST /api/auth/logout
Body: { refresh_token }

# Logout all devices
POST /api/auth/logout-all
Headers: Authorization: Bearer <token>

# List sessions
GET /api/auth/sessions
Headers: Authorization: Bearer <token>
```

---

## ✅ Verification Checklist

- [ ] Migration script ran successfully
- [ ] Backend restarted without errors
- [ ] Can login to admin frontend
- [ ] Can login to customer frontend
- [ ] Can login to bartender frontend
- [ ] Tokens saved in localStorage
- [ ] Session created in database
- [ ] Auto-refresh works (wait 25 min)
- [ ] Logout clears session
- [ ] Can see sessions list (admin)

---

## 📚 Full Documentation

For detailed technical documentation, see:
- `docs/SESSION_MANAGEMENT_COMPLETE.md` - Full technical docs
- `SESSION_IMPLEMENTATION_SUMMARY.md` - Implementation summary

---

## 🎉 That's It!

Session management is now active on all three frontends. Users will stay logged in for 7 days with automatic token refresh. No code changes needed in your components - it all happens automatically in the API interceptors!

# Session Token Storage Information

**Date:** February 25, 2026  
**Status:** Current Implementation

---

## Token Expiration Times

### Access Token (JWT)
- **Duration:** 30 minutes
- **Configuration:** `ACCESS_TOKEN_EXPIRE_MINUTES = 30` in `backend/config.py`
- **Purpose:** Short-lived token for API authentication
- **Storage:** localStorage in browser

### Refresh Token
- **Duration:** 7 days
- **Configuration:** Hardcoded in `backend/auth.py` (`timedelta(days=7)`)
- **Purpose:** Long-lived token to get new access tokens
- **Storage:** Database (UserSession table) + localStorage

### Session
- **Duration:** 7 days (tied to refresh token)
- **Configuration:** Hardcoded in `backend/auth.py`
- **Purpose:** Track user sessions across devices
- **Storage:** Database (UserSession table)

---

## Storage Locations

### Backend (Database)
**Table:** `UserSession`

Stores:
- `refresh_token` - The refresh token string
- `access_token` - Current access token
- `user_id` - User who owns the session
- `device_info` - Device information
- `ip_address` - IP address
- `user_agent` - Browser/app info
- `expires_at` - When session expires (7 days)
- `is_active` - Whether session is still valid
- `last_activity` - Last time session was used

### Frontend (Browser localStorage)

**Customer Frontend:**
- `access_token` - JWT access token (30 min)
- `user` - User object (JSON string)

**Bartender Frontend:**
- `bartender_token` - JWT access token (30 min)
- `bartender` - User object (JSON string)

**Admin Frontend:**
- `admin_token` - JWT access token (30 min)
- `admin_user` - User object (JSON string)

---

## Token Lifecycle

### 1. Login
```
User logs in
  ↓
Backend creates:
  - Access token (30 min)
  - Refresh token (7 days)
  - Session record in DB
  ↓
Frontend stores:
  - access_token in localStorage
  - user object in localStorage
```

### 2. API Requests
```
Frontend sends request
  ↓
Includes: Authorization: Bearer {access_token}
  ↓
Backend validates JWT
  ↓
If valid (not expired): Process request
If expired: Return 401 Unauthorized
```

### 3. Token Refresh (Not Implemented Yet)
```
Access token expires (30 min)
  ↓
Frontend detects 401 error
  ↓
Should call /auth/refresh with refresh_token
  ↓
Backend validates refresh token
  ↓
If valid: Issue new access token
If expired: User must login again
```

### 4. Logout
```
User clicks logout
  ↓
Frontend:
  - Removes access_token from localStorage
  - Removes user from localStorage
  ↓
Backend (if called):
  - Marks session as inactive in DB
```

---

## Current Behavior

### What Happens After 30 Minutes?
**Access token expires, but:**
- ❌ No automatic token refresh implemented
- ❌ User will get 401 errors on next API call
- ❌ User must manually login again

### What Happens After 7 Days?
**Refresh token expires:**
- ❌ Session becomes invalid in database
- ❌ User must login again (no way to refresh)

### What Happens on Browser Close?
**localStorage persists:**
- ✅ Tokens remain in localStorage
- ✅ User stays logged in (until token expires)
- ✅ User doesn't need to login again

---

## Issues & Recommendations

### 🔴 Critical Issues

#### 1. No Token Refresh Mechanism
**Problem:** After 30 minutes, users get logged out automatically

**Impact:** Poor user experience - users must login every 30 minutes

**Solution:** Implement token refresh endpoint and automatic refresh in frontend

#### 2. No Session Cleanup
**Problem:** Expired sessions remain in database forever

**Impact:** Database bloat, potential security issue

**Solution:** Add periodic cleanup job to remove expired sessions

---

### 🟡 Medium Priority Issues

#### 3. Inconsistent Token Storage Keys
**Problem:** Different keys for different frontends:
- Customer: `access_token`
- Bartender: `bartender_token`
- Admin: `admin_token`

**Impact:** Confusing, harder to maintain

**Solution:** Standardize to `access_token` across all frontends

#### 4. No "Remember Me" Option
**Problem:** All sessions expire after 7 days

**Impact:** Users must login weekly even if they want to stay logged in

**Solution:** Add "Remember Me" checkbox with 30-day tokens

---

### 🟢 Low Priority Issues

#### 5. No Session Management UI
**Problem:** Users can't see or manage their active sessions

**Impact:** Can't logout from other devices

**Solution:** Add "Active Sessions" page in profile

#### 6. No Token Revocation
**Problem:** Can't invalidate tokens before expiration

**Impact:** Security risk if token is compromised

**Solution:** Implement token blacklist or check session in DB on each request

---

## Recommended Improvements

### Priority 1: Implement Token Refresh (1-2 hours)

**Backend:**
```python
# Add to backend/routers/auth.py
@router.post("/refresh")
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    # Validate refresh token
    session = get_session_by_refresh_token(db, refresh_token)
    if not session:
        raise HTTPException(401, "Invalid refresh token")
    
    # Create new tokens
    new_access_token = create_access_token({"sub": session.user_id})
    new_refresh_token = create_refresh_token({"sub": session.user_id})
    
    # Update session
    update_session_tokens(db, session.id, new_access_token, new_refresh_token)
    
    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token
    }
```

**Frontend:**
```typescript
// Add to frontend/src/services/api.ts
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', { refresh_token: refreshToken });
          localStorage.setItem('access_token', response.data.access_token);
          localStorage.setItem('refresh_token', response.data.refresh_token);
          // Retry original request
          return apiClient.request(error.config);
        } catch {
          // Refresh failed, logout
          authService.logout();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

---

### Priority 2: Add Session Cleanup Job (30 minutes)

**Backend:**
```python
# Add to backend/main.py
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

def cleanup_sessions():
    db = next(get_db())
    cleanup_expired_sessions(db)
    print(f"Cleaned up expired sessions at {datetime.now()}")

# Run every hour
scheduler.add_job(cleanup_sessions, 'interval', hours=1)
scheduler.start()
```

---

### Priority 3: Standardize Token Storage (15 minutes)

**Change all frontends to use:**
- `access_token` (not `bartender_token` or `admin_token`)
- `refresh_token` (store this too!)
- `user` (not `bartender` or `admin_user`)

---

### Priority 4: Add "Remember Me" (1 hour)

**Backend:**
```python
def create_access_token(data: dict, remember_me: bool = False):
    expire_days = 30 if remember_me else None
    # ... rest of implementation
```

**Frontend:**
```tsx
<input type="checkbox" id="remember" />
<label htmlFor="remember">Remember me for 30 days</label>
```

---

## Security Considerations

### Current Security Level: ⚠️ Medium

**Good:**
- ✅ JWT tokens are signed
- ✅ Passwords are hashed with bcrypt
- ✅ HTTPS recommended (self-signed cert)
- ✅ Tokens stored in localStorage (not cookies)

**Needs Improvement:**
- ⚠️ No token refresh (users logged out every 30 min)
- ⚠️ No token revocation
- ⚠️ No session management
- ⚠️ No rate limiting on login
- ⚠️ No CSRF protection (not needed for JWT in localStorage)

---

## Quick Reference

### Current Settings
```
Access Token:  30 minutes
Refresh Token: 7 days
Session:       7 days
Storage:       localStorage (browser)
Refresh:       ❌ Not implemented
Cleanup:       ❌ Not implemented
```

### Recommended Settings
```
Access Token:  30 minutes (keep)
Refresh Token: 7 days (keep) or 30 days with "Remember Me"
Session:       Match refresh token
Storage:       localStorage + Database
Refresh:       ✅ Implement automatic refresh
Cleanup:       ✅ Hourly cleanup job
```

---

## Testing Token Expiration

### Manual Test (Access Token)
```bash
# 1. Login and get token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 2. Wait 31 minutes

# 3. Try to access protected endpoint
curl http://localhost:8000/api/profile/me \
  -H "Authorization: Bearer {expired_token}"

# Expected: 401 Unauthorized
```

### Manual Test (Session)
```sql
-- Check active sessions
SELECT * FROM user_sessions WHERE is_active = true;

-- Check expired sessions
SELECT * FROM user_sessions WHERE expires_at < NOW();

-- Manually expire a session
UPDATE user_sessions SET expires_at = NOW() WHERE id = 'session_id';
```

---

## Summary

**Current Implementation:**
- ✅ JWT tokens working
- ✅ 30-minute access tokens
- ✅ 7-day refresh tokens (stored in DB)
- ✅ Session tracking in database
- ❌ No automatic token refresh
- ❌ No session cleanup
- ❌ Users must login every 30 minutes

**Recommended Next Steps:**
1. Implement token refresh mechanism (1-2 hours)
2. Add session cleanup job (30 minutes)
3. Standardize token storage keys (15 minutes)
4. Add "Remember Me" option (1 hour)

**Total Time to Fix:** ~3-4 hours

---

**Need help implementing any of these improvements? Let me know!**

# Phase 2 Task 2.1 - Testing Instructions

## HttpOnly Cookie Implementation Testing

### Prerequisites

1. **Restart the backend** to load the new cookie code:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Have a test user ready**:
   - Email: `admin@storemybottle.com`
   - Password: `admin123`

### Automated Testing

Run the test script:
```bash
cd backend
python test_httponly_cookies.py
```

This will test:
- ✅ Login sets HttpOnly cookies
- ✅ Cookies work for authenticated requests
- ✅ Token refresh updates cookies
- ✅ Logout clears cookies
- ✅ Requests fail after logout

### Manual Testing with Browser DevTools

1. **Open Browser DevTools** (F12)
2. **Go to Application/Storage tab**
3. **Navigate to** `http://localhost:8000` (or your backend URL)
4. **Login via frontend**
5. **Check Cookies section**:
   - Should see `access_token` cookie
   - Should see `refresh_token` cookie
   - Both should have `HttpOnly` flag ✅
   - Both should have `SameSite=Lax` ✅

### Manual Testing with cURL (Windows PowerShell)

#### Test 1: Login and Save Cookies
```powershell
# Login and save cookies to file
curl.exe -X POST http://localhost:8000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@storemybottle.com\",\"password\":\"admin123\"}' `
  -c cookies.txt `
  -v
```

Look for these lines in output:
```
< Set-Cookie: access_token=...; HttpOnly; Path=/; SameSite=Lax
< Set-Cookie: refresh_token=...; HttpOnly; Path=/; SameSite=Lax
```

#### Test 2: Use Cookies for Authenticated Request
```powershell
# Get profile using saved cookies
curl.exe -X GET http://localhost:8000/api/profile `
  -b cookies.txt `
  -v
```

Should return 200 OK with profile data.

#### Test 3: Logout and Clear Cookies
```powershell
# Logout (cookies will be cleared)
curl.exe -X POST http://localhost:8000/api/auth/logout `
  -H "Content-Type: application/json" `
  -d '{\"refresh_token\":\"YOUR_REFRESH_TOKEN\"}' `
  -b cookies.txt `
  -c cookies.txt `
  -v
```

Look for:
```
< Set-Cookie: access_token=; Path=/; Max-Age=0
< Set-Cookie: refresh_token=; Path=/; Max-Age=0
```

#### Test 4: Verify Cookies Are Cleared
```powershell
# Try to access profile after logout
curl.exe -X GET http://localhost:8000/api/profile `
  -b cookies.txt `
  -v
```

Should return 401 Unauthorized.

### Expected Results

| Test | Expected Result |
|------|----------------|
| Login | Sets `access_token` and `refresh_token` cookies with HttpOnly flag |
| Authenticated Request | Works with cookies, no Authorization header needed |
| Token Refresh | Updates both cookies with new tokens |
| Logout | Clears both cookies (Max-Age=0) |
| Request After Logout | Returns 401 Unauthorized |

### Cookie Attributes to Verify

✅ **HttpOnly**: true (prevents JavaScript access)  
✅ **Secure**: false (dev), true (production)  
✅ **SameSite**: Lax (CSRF protection)  
✅ **Path**: /  
✅ **Max-Age**: 1800 (access), 604800 (refresh)

### Troubleshooting

**Issue**: Backend crashes on login  
**Solution**: Restart backend to load new code

**Issue**: Cookies not set  
**Solution**: Check backend logs for errors

**Issue**: 401 on authenticated requests  
**Solution**: Verify cookies are being sent with request

**Issue**: Cookies not cleared on logout  
**Solution**: Check that Response object is passed to logout endpoint

### Next Steps After Testing

Once cookies are verified working:
1. ✅ Mark Task 2.1 as complete
2. ⏭️ Move to Task 2.2: Fix CORS Configuration
3. 🔄 Eventually migrate frontends to use cookies instead of localStorage

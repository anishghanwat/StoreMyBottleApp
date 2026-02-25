# Authentication Quick Reference

## Login Credentials

### Admin Account
```
Email: admin@storemybottle.com
Password: [Set during setup]
Role: admin
Access: Full admin panel + bartender portal
```

### Bartender Account
```
Email: [Bartender email]
Password: [Set during setup]
Role: bartender
Venue: Assigned venue
Access: Bartender portal only
```

### Customer Account
```
Email/Phone: Any registered user
Password: User-set password
Role: customer
Access: Customer app only
```

## API Endpoints

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Signup
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {access_token}
```

### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

## Frontend URLs

### Customer App
```
http://localhost:5173/login
```

### Bartender Portal
```
http://localhost:5174/login
```

### Admin Panel
```
http://localhost:5175/
```

## Token Storage

### Customer Frontend
```javascript
localStorage.getItem('access_token')
localStorage.getItem('user')
```

### Bartender Frontend
```javascript
localStorage.getItem('bartender_token')
localStorage.getItem('bartender')
```

### Admin Frontend
```javascript
localStorage.getItem('admin_token')
localStorage.getItem('admin_user')
```

## Role Checks

### Backend
```python
# Require bartender or admin
@router.get("/endpoint")
def endpoint(current_user: User = Depends(get_current_active_bartender)):
    pass

# Require admin only
@router.get("/endpoint")
def endpoint(current_user: User = Depends(get_current_active_admin)):
    pass

# Any authenticated user
@router.get("/endpoint")
def endpoint(current_user: User = Depends(get_current_user)):
    pass
```

### Frontend
```typescript
// Check if authenticated
if (authService.isAuthenticated()) {
  // User is logged in
}

// Get stored user
const user = authService.getStoredUser();
if (user.role === 'admin') {
  // User is admin
}
```

## Common Commands

### Create Admin User
```bash
cd backend
python create_admin.py
```

### Verify Auth System
```bash
cd backend
python verify_auth.py
```

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@storemybottle.com","password":"admin123"}'
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Login again or refresh token |
| 403 | Forbidden | User doesn't have required role |
| 400 | Bad Request | Check request format |
| 404 | Not Found | User doesn't exist |

## Security Notes

1. **Never commit** JWT_SECRET_KEY to git
2. **Always use HTTPS** in production
3. **Rotate secrets** regularly
4. **Set strong passwords** for admin accounts
5. **Monitor** failed login attempts
6. **Expire sessions** after inactivity

## Troubleshooting

### "Invalid email or password"
- Check credentials are correct
- Verify user exists in database
- Check password was hashed correctly

### "Access denied"
- User role doesn't match required role
- Login with correct account type

### "Could not validate credentials"
- Token expired (30 minutes)
- Token invalid or tampered
- Refresh token or login again

### "Email already registered"
- User already exists
- Login instead of signup
- Use different email

## Development vs Production

### Development
- OTP always "123456"
- Debug OTP shown in response
- Shorter token expiry for testing

### Production
- Random 6-digit OTP
- No debug info in responses
- Longer token expiry
- HTTPS required
- Strong JWT secret required

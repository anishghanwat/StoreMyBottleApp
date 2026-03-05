# EC2 Frontend Connection Fix

## Issue
Frontend apps returning ERR_CONNECTION_REFUSED on ports 5173, 5174, 5175

## Root Cause
1. Admin app runs on port 3000 internally (not 5173)
2. Bartender app runs on port 5174 internally (not 5173)
3. All apps use HTTPS (not HTTP) due to basicSsl plugin
4. Docker port mappings were incorrect

## Solution

### 1. Update docker-compose.yml (DONE)
Fixed port mappings:
- Frontend: 5173:5173 ✓
- Bartender: 5174:5174 ✓ (was 5174:5173)
- Admin: 5175:3000 ✓ (was 5175:5173)

### 2. Restart Containers on EC2

```bash
cd ~/StoreMyBottleApp

# Pull latest changes
git pull origin main

# Restart admin container with new port mapping
docker-compose up -d admin

# Verify all services
docker-compose ps
```

### 3. Access URLs

All frontends use HTTPS (self-signed certificates):

- Customer: https://43.205.237.225:5173
- Bartender: https://43.205.237.225:5174
- Admin: https://43.205.237.225:5175
- Backend: http://43.205.237.225:8000

### 4. Browser Certificate Warning

You'll see "Your connection is not private" warnings because of self-signed SSL certificates.

**To proceed:**
- Chrome/Edge: Click "Advanced" → "Proceed to 43.205.237.225 (unsafe)"
- Firefox: Click "Advanced" → "Accept the Risk and Continue"
- Safari: Click "Show Details" → "visit this website"

This is normal for development. For production, you'd use Let's Encrypt certificates.

### 5. Verify Services

```bash
# Check if containers are running
docker-compose ps

# Should show:
# storemybottle_frontend   Up   0.0.0.0:5173->5173/tcp
# storemybottle_bartender  Up   0.0.0.0:5174->5174/tcp
# storemybottle_admin      Up   0.0.0.0:5175->3000/tcp
# storemybottle_backend    Up   0.0.0.0:8000->8000/tcp
# storemybottle_db         Up   0.0.0.0:3306->3306/tcp

# Test from EC2 instance
curl -k https://localhost:5173  # Customer
curl -k https://localhost:5174  # Bartender
curl -k https://localhost:5175  # Admin
```

## Why HTTPS?

All three frontends use `@vitejs/plugin-basic-ssl` for HTTPS because:
1. Camera access (QR scanning) requires HTTPS
2. Geolocation API requires HTTPS
3. Service Workers require HTTPS
4. Modern browser security policies

## Next Steps

1. Pull the updated docker-compose.yml
2. Restart the admin container
3. Access via HTTPS URLs
4. Accept browser certificate warnings
5. Test all three apps

## Admin Login

- URL: https://43.205.237.225:5175
- Email: admin@storemybottle.com
- Password: admin123

# Environment Configuration Guide

## Overview

All three frontends (customer, bartender, admin) now have separate environment configurations for development and production.

---

## File Structure

Each frontend has three `.env` files:

```
frontend/
├── .env                    # Base config (fallback)
├── .env.development        # Development config (HTTP)
└── .env.production         # Production config (HTTPS)

frontend-bartender/
├── .env                    # Base config (fallback)
├── .env.development        # Development config (HTTP)
└── .env.production         # Production config (HTTPS)

admin/
├── .env                    # Base config (fallback)
├── .env.development        # Development config (HTTP)
└── .env.production         # Production config (HTTPS)
```

---

## How It Works

Vite automatically loads the correct environment file based on the command:

| Command | File Loaded | API URL |
|---------|-------------|---------|
| `npm run dev` | `.env.development` | `http://localhost:8000` |
| `npm run build` | `.env.production` | `https://api.storemybottle.com` |
| `npm run preview` | `.env.production` | `https://api.storemybottle.com` |

---

## Development Configuration

**File**: `.env.development`

```env
# All frontends use HTTP in development
VITE_API_URL=http://localhost:8000
```

**Why HTTP?**
- No SSL certificate issues
- Faster development
- Easier debugging
- Backend security headers are relaxed in dev mode

**Backend runs without SSL**:
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## Production Configuration

**File**: `.env.production`

```env
# All frontends use HTTPS in production
VITE_API_URL=https://api.storemybottle.com
```

**Why HTTPS?**
- Secure data transmission
- HttpOnly cookies require HTTPS
- Security headers enforced
- Browser security requirements

**Backend runs with SSL**:
```bash
cd backend
python -m uvicorn main:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem --host 0.0.0.0 --port 443
```

---

## Current Settings

### Development (`.env.development`)

**Customer Frontend** (`frontend/`):
```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
```

**Bartender Frontend** (`frontend-bartender/`):
```env
VITE_API_URL=http://localhost:8000
```

**Admin Panel** (`admin/`):
```env
VITE_API_URL=http://localhost:8000
```

### Production (`.env.production`)

**All Frontends**:
```env
VITE_API_URL=https://api.storemybottle.com
```

---

## Usage

### Development

1. **Start Backend** (HTTP):
   ```bash
   cd backend
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend** (automatically uses `.env.development`):
   ```bash
   # Customer
   cd frontend
   npm run dev

   # Bartender
   cd frontend-bartender
   npm run dev

   # Admin
   cd admin
   npm run dev
   ```

3. **Access**:
   - Customer: http://localhost:5173
   - Bartender: http://localhost:5174
   - Admin: http://localhost:5175
   - Backend: http://localhost:8000

### Production Build

1. **Build Frontend** (automatically uses `.env.production`):
   ```bash
   # Customer
   cd frontend
   npm run build

   # Bartender
   cd frontend-bartender
   npm run build

   # Admin
   cd admin
   npm run build
   ```

2. **Deploy**:
   - Frontend builds are in `dist/` folders
   - Backend runs with SSL on port 443
   - All API calls use HTTPS

---

## Customizing for Your Environment

### Local Development with HTTPS

If you want to test HTTPS locally:

1. **Update `.env.development`**:
   ```env
   VITE_API_URL=https://localhost:8000
   ```

2. **Start backend with SSL**:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --ssl-keyfile=key.pem --ssl-certfile=cert.pem --host 0.0.0.0 --port 8000
   ```

3. **Accept certificate**:
   - Open https://localhost:8000/docs
   - Click "Advanced" → "Proceed to localhost (unsafe)"
   - Reload frontend

### Staging Environment

Create `.env.staging` files:

```env
VITE_API_URL=https://staging-api.storemybottle.com
```

Run with:
```bash
npm run build -- --mode staging
```

---

## Environment Variables Reference

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-client-id.apps.googleusercontent.com` |

### Backend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment mode | `development` or `production` |
| `CORS_ORIGINS` | Allowed CORS origins | `https://app.storemybottle.com,https://admin.storemybottle.com` |
| `JWT_SECRET_KEY` | JWT signing secret | `your-64-char-secret` |
| `DATABASE_URL` | Database connection | `mysql+pymysql://user:pass@host/db` |

---

## Security Considerations

### Development
- ✅ HTTP allowed for easier development
- ✅ Relaxed CORS (localhost origins auto-added)
- ✅ HSTS header: 1 hour
- ✅ No HTTPS redirect
- ⚠️ Self-signed certificates accepted

### Production
- ✅ HTTPS enforced
- ✅ Strict CORS (explicit origin whitelist)
- ✅ HSTS header: 1 year
- ✅ HTTP → HTTPS redirect
- ✅ Valid SSL certificates required
- ✅ HttpOnly cookies
- ✅ Security headers enforced

---

## Troubleshooting

### Issue: "ERR_SSL_PROTOCOL_ERROR"

**Cause**: Frontend using HTTPS but backend not running with SSL

**Fix**: 
- Use `.env.development` (HTTP) for local dev
- Or start backend with SSL and accept certificate

### Issue: "CORS Error"

**Cause**: Frontend origin not in CORS whitelist

**Fix**: 
- Development: Origins auto-added (localhost:5173, 5174, 5175)
- Production: Add origin to `CORS_ORIGINS` in backend `.env`

### Issue: "Failed to fetch"

**Cause**: Backend not running or wrong URL

**Fix**:
- Check backend is running: http://localhost:8000/docs
- Verify `VITE_API_URL` matches backend URL
- Check browser console for actual error

### Issue: Environment not loading

**Cause**: Need to restart dev server after changing `.env`

**Fix**:
- Stop dev server (Ctrl+C)
- Restart: `npm run dev`
- Vite only loads env vars on startup

---

## Best Practices

1. **Never commit secrets** to `.env` files
2. **Use `.env.local`** for personal overrides (gitignored)
3. **Document all variables** in `.env.example`
4. **Use different secrets** for dev/staging/prod
5. **Validate env vars** on app startup
6. **Use HTTPS in production** always
7. **Test production builds** locally with `npm run preview`

---

## Quick Commands

```bash
# Development (HTTP)
cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production (HTTPS)
cd backend && python -m uvicorn main:app --ssl-keyfile=key.pem --ssl-certfile=cert.pem --host 0.0.0.0 --port 443

# Build for production
cd frontend && npm run build
cd frontend-bartender && npm run build
cd admin && npm run build

# Preview production build locally
cd frontend && npm run preview
```

---

## Next Steps

1. ✅ Environment files created
2. ✅ Development uses HTTP
3. ✅ Production uses HTTPS
4. ⏳ Update production domain in `.env.production` files
5. ⏳ Get valid SSL certificates for production
6. ⏳ Configure production CORS origins
7. ⏳ Set up production secrets management

---

## Related Documentation

- [Phase 2 Task 2.2: CORS Configuration](./PHASE2_TASK2_CORS_COMPLETE.md)
- [Phase 2 Task 2.3: HTTPS Enforcement](./PHASE2_TASK3_HTTPS_COMPLETE.md)
- [Security Remediation Plan](./SECURITY_REMEDIATION_PLAN.md)

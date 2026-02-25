# 🔧 Render Deployment Fix - MySQL Driver Issue

## Problem

Render deployment was failing with:
```
ModuleNotFoundError: No module named 'MySQLdb'
```

## Root Cause

When Render provides a `DATABASE_URL` environment variable, it uses the format:
```
mysql://user:password@host:port/database
```

However, SQLAlchemy tries to use the default MySQL driver (MySQLdb/mysqlclient) which requires system-level MySQL client libraries that are difficult to install in a containerized environment.

## Solution

We're using `pymysql` which is a pure Python MySQL driver that doesn't require system dependencies. The fix involves automatically converting the DATABASE_URL to use pymysql.

### Changes Made

#### 1. Updated `backend/database.py`

Added automatic URL conversion:

```python
# Ensure DATABASE_URL uses pymysql driver
database_url = settings.DATABASE_URL
if database_url.startswith("mysql://"):
    database_url = database_url.replace("mysql://", "mysql+pymysql://", 1)

# Create database engine
engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=settings.ENVIRONMENT == "development"
)
```

This automatically converts:
- `mysql://user:pass@host/db` → `mysql+pymysql://user:pass@host/db`

#### 2. Kept `pymysql` in requirements.txt

```
pymysql==1.1.0
cryptography==42.0.0  # Required by pymysql for secure connections
```

#### 3. Simplified Dockerfile.prod

Removed unnecessary MySQL client libraries since pymysql doesn't need them.

## How to Deploy on Render

### Step 1: Set Up Database (Railway)

1. Go to https://railway.app
2. Create new project → Provision MySQL
3. Copy the connection string (looks like: `mysql://root:password@host:port/railway`)

### Step 2: Deploy Backend (Render)

1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repository
4. Configure:
   - **Name:** storemybottle-api
   - **Region:** Oregon (or closest to you)
   - **Branch:** main
   - **Root Directory:** backend
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. Add Environment Variables:
   ```
   DATABASE_URL=mysql://your-railway-connection-string
   JWT_SECRET_KEY=your-super-secret-key-min-32-characters
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   RESEND_API_KEY=re_49oNXB8Z_FuYdRhfry9mruG44YEsdQbbE
   FROM_EMAIL=onboarding@resend.dev
   FRONTEND_URL=*
   ENVIRONMENT=production
   ```

6. Click "Create Web Service"

### Step 3: Initialize Database

Once deployed, run these commands in Render Shell:

```bash
# Initialize database schema
python init_db.py

# Create admin user
python create_admin.py
```

### Step 4: Deploy Frontends (Vercel)

Deploy each frontend separately:

1. **Customer Frontend:**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-render-url.onrender.com`

2. **Bartender Frontend:**
   - Root Directory: `frontend-bartender`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-render-url.onrender.com`

3. **Admin Portal:**
   - Root Directory: `admin`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-render-url.onrender.com`

## Verification

### Test Backend

```bash
# Health check
curl https://your-app.onrender.com/

# API docs
https://your-app.onrender.com/docs
```

### Test Database Connection

In Render Shell:
```bash
python -c "from database import engine; print(engine.connect())"
```

Should output: `<sqlalchemy.engine.base.Connection object at 0x...>`

## Common Issues

### Issue: "Can't connect to MySQL server"

**Solution:** Check DATABASE_URL format and ensure Railway database is accessible.

```bash
# Test connection
python -c "import pymysql; pymysql.connect(host='your-host', user='root', password='pass', database='railway')"
```

### Issue: "Access denied for user"

**Solution:** Verify DATABASE_URL credentials are correct.

### Issue: "Unknown database"

**Solution:** Ensure the database name in DATABASE_URL matches the Railway database name (usually `railway`).

### Issue: "SSL connection error"

**Solution:** Add `?ssl_disabled=true` to DATABASE_URL if Railway doesn't require SSL:
```
mysql://user:pass@host:port/db?ssl_disabled=true
```

Or for SSL required:
```
mysql://user:pass@host:port/db?ssl_ca=/etc/ssl/certs/ca-certificates.crt
```

## Alternative: Use Docker on Render

If you prefer Docker deployment:

1. In Render, select "Docker" as environment
2. Set Dockerfile path: `backend/Dockerfile.prod`
3. Render will build and deploy the Docker image
4. Same environment variables apply

## Why pymysql?

**Advantages:**
- ✅ Pure Python (no system dependencies)
- ✅ Easy to install (`pip install pymysql`)
- ✅ Works in any environment
- ✅ Fully compatible with SQLAlchemy
- ✅ Supports all MySQL features

**Disadvantages:**
- ⚠️ Slightly slower than mysqlclient (negligible for most apps)

For production at scale, you might consider:
- Using PostgreSQL instead (better cloud support)
- Using managed database services (AWS RDS, Google Cloud SQL)
- Optimizing connection pooling

## Summary

The fix ensures that regardless of how the DATABASE_URL is provided (with or without driver specification), the application will use pymysql, which works reliably in cloud environments without requiring system-level MySQL client libraries.

---

**Status:** ✅ Fixed and Ready to Deploy
**Next:** Push changes and redeploy on Render

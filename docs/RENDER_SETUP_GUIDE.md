# 🚀 Render Backend Deployment - Step by Step

## Prerequisites

✅ Railway MySQL database is running
✅ GitHub repository is up to date
✅ You have the Railway connection string

---

## Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

---

## Step 2: Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect account"** if not already connected
4. Find and select: `anishghanwat/StoreMyBottleApp`
5. Click **"Connect"**

---

## Step 3: Configure Service

### Basic Settings

| Setting | Value |
|---------|-------|
| **Name** | `storemybottle-api` |
| **Region** | Oregon (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Environment** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

### Instance Type
- Select: **Free** (0.1 CPU, 512 MB RAM)

---

## Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables one by one:

### 1. DATABASE_URL
```
mysql://root:nSeiUCOdAZKJdosMIpvSdqfYRoeyhjNZ@switchyard.proxy.rlwy.net:12410/railway
```

### 2. JWT_SECRET_KEY
```
storemybottle-super-secret-jwt-key-production-2026-change-this-to-something-random
```
⚠️ **Important:** Change this to a random 32+ character string!

### 3. JWT_ALGORITHM
```
HS256
```

### 4. ACCESS_TOKEN_EXPIRE_MINUTES
```
30
```

### 5. RESEND_API_KEY
```
re_49oNXB8Z_FuYdRhfry9mruG44YEsdQbbE
```

### 6. FROM_EMAIL
```
onboarding@resend.dev
```

### 7. FRONTEND_URL
```
*
```
(Will update this later with actual frontend URLs)

### 8. ENVIRONMENT
```
production
```

---

## Step 5: Deploy

1. Review all settings
2. Click **"Create Web Service"**
3. Wait for deployment (5-10 minutes)
4. Watch the logs for any errors

### Expected Log Output:
```
==> Building...
==> Deploying...
==> Your service is live 🎉
```

---

## Step 6: Initialize Database

Once deployment is successful:

1. Go to your service dashboard
2. Click **"Shell"** tab (top menu)
3. Wait for shell to connect
4. Run these commands:

```bash
# Initialize database schema
python init_db.py

# Create admin user
python create_admin.py
```

### Expected Output:
```
Database initialized successfully!
Admin user created successfully!
```

---

## Step 7: Test Your API

### Test Health Endpoint
Visit: `https://storemybottle-api.onrender.com/`

Should return:
```json
{"message": "StoreMyBottle API is running"}
```

### Test API Documentation
Visit: `https://storemybottle-api.onrender.com/docs`

You should see the interactive API documentation (Swagger UI).

### Test Login Endpoint
In the API docs, try the `/auth/login` endpoint with admin credentials.

---

## Step 8: Copy Your API URL

Your backend API URL will be:
```
https://storemybottle-api.onrender.com
```

**Save this URL!** You'll need it for deploying the frontends.

---

## 🎯 What's Next?

Now that your backend is deployed, you need to deploy the 3 frontends:

1. **Customer Frontend** → Vercel
2. **Bartender Frontend** → Vercel  
3. **Admin Portal** → Vercel

See `VERCEL_SETUP_GUIDE.md` for frontend deployment instructions.

---

## 🔍 Troubleshooting

### Deployment Failed

**Check Build Logs:**
- Look for Python errors
- Verify requirements.txt is correct
- Check if all dependencies installed

**Common Issues:**
- Missing environment variables
- Wrong Python version
- Database connection failed

### Database Connection Error

**Verify:**
1. DATABASE_URL is correct
2. Railway database is running
3. No typos in connection string

**Test Connection:**
In Render Shell:
```bash
python -c "from database import engine; print(engine.connect())"
```

### Service Won't Start

**Check:**
1. Start command is correct
2. Port is set to `$PORT` (Render provides this)
3. All environment variables are set

**View Logs:**
Dashboard → Logs tab → Look for error messages

### 502 Bad Gateway

**Causes:**
- Service is still starting (wait 1-2 minutes)
- Service crashed (check logs)
- Health check failing

**Solution:**
- Wait for service to fully start
- Check logs for errors
- Verify database connection

---

## 📊 Monitoring

### View Logs
Dashboard → Your Service → **Logs** tab

### View Metrics
Dashboard → Your Service → **Metrics** tab
- CPU usage
- Memory usage
- Request count
- Response times

### Set Up Alerts
Dashboard → Your Service → **Settings** → **Notifications**

---

## 🔄 Redeployment

Render automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update backend"
git push
```

Render will detect the push and redeploy automatically.

### Manual Redeploy
Dashboard → Your Service → **Manual Deploy** → **Deploy latest commit**

---

## 💰 Free Tier Limits

Render Free Tier includes:
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ⚠️ Service spins down after 15 minutes of inactivity
- ⚠️ Cold start takes 30-60 seconds

**Note:** First request after inactivity will be slow (cold start).

---

## 🎉 Success!

Your backend API is now live and accessible at:
```
https://storemybottle-api.onrender.com
```

Next step: Deploy the frontends to Vercel!

---

**Need Help?**
- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Check `RENDER_DEPLOYMENT_FIX.md` for common issues

# 🌐 Vercel Frontend Deployment - Step by Step

Deploy all 3 frontends (Customer, Bartender, Admin) to Vercel for free.

---

## Prerequisites

✅ Backend API is deployed on Render
✅ You have your Render API URL: `https://storemybottle-api.onrender.com`
✅ GitHub repository is up to date

---

## Overview

You'll deploy 3 separate projects on Vercel:

1. **Customer Frontend** (`frontend/`)
2. **Bartender Frontend** (`frontend-bartender/`)
3. **Admin Portal** (`admin/`)

Each deployment takes about 2-3 minutes.

---

## Step 1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your repositories

---

## Deployment 1: Customer Frontend

### Step 1.1: Import Project

1. Go to https://vercel.com/new
2. Find `anishghanwat/StoreMyBottleApp`
3. Click **"Import"**

### Step 1.2: Configure Project

| Setting | Value |
|---------|-------|
| **Project Name** | `storemybottle-customer` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` ← Click "Edit" and select this |
| **Build Command** | `npm run build` (auto-detected) |
| **Output Directory** | `dist` (auto-detected) |
| **Install Command** | `npm install` (auto-detected) |

### Step 1.3: Add Environment Variable

Click **"Environment Variables"** section:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://storemybottle-api.onrender.com` |

⚠️ **Important:** Use your actual Render URL!

### Step 1.4: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes
3. You'll see: **"Congratulations! Your project has been deployed."**

### Step 1.5: Save Your URL

Your customer app will be at:
```
https://storemybottle-customer.vercel.app
```

---

## Deployment 2: Bartender Frontend

### Step 2.1: Import Project Again

1. Go to https://vercel.com/new
2. Find `anishghanwat/StoreMyBottleApp` again
3. Click **"Import"**

### Step 2.2: Configure Project

| Setting | Value |
|---------|-------|
| **Project Name** | `storemybottle-bartender` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend-bartender` ← Click "Edit" |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Step 2.3: Add Environment Variable

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://storemybottle-api.onrender.com` |

### Step 2.4: Deploy

Click **"Deploy"** and wait 2-3 minutes.

### Step 2.5: Save Your URL

Your bartender app will be at:
```
https://storemybottle-bartender.vercel.app
```

---

## Deployment 3: Admin Portal

### Step 3.1: Import Project Again

1. Go to https://vercel.com/new
2. Find `anishghanwat/StoreMyBottleApp` again
3. Click **"Import"**

### Step 3.2: Configure Project

| Setting | Value |
|---------|-------|
| **Project Name** | `storemybottle-admin` |
| **Framework Preset** | `Vite` |
| **Root Directory** | `admin` ← Click "Edit" |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Step 3.3: Add Environment Variable

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://storemybottle-api.onrender.com` |

### Step 3.4: Deploy

Click **"Deploy"** and wait 2-3 minutes.

### Step 3.5: Save Your URL

Your admin portal will be at:
```
https://storemybottle-admin.vercel.app
```

---

## Step 2: Update Backend CORS

Now that you have all frontend URLs, update the backend to allow them.

### Option A: Update on Render Dashboard

1. Go to Render Dashboard
2. Select your `storemybottle-api` service
3. Go to **Environment** tab
4. Find `FRONTEND_URL` variable
5. Update value to:
```
https://storemybottle-customer.vercel.app,https://storemybottle-bartender.vercel.app,https://storemybottle-admin.vercel.app
```
6. Click **"Save Changes"**
7. Service will automatically redeploy

### Option B: Update in Code (Recommended)

Update `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://storemybottle-customer.vercel.app",
        "https://storemybottle-bartender.vercel.app",
        "https://storemybottle-admin.vercel.app",
        "http://localhost:5173",  # Keep for local dev
        "http://localhost:5174",
        "http://localhost:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then push to GitHub:
```bash
git add backend/main.py
git commit -m "Update CORS for production URLs"
git push
```

Render will auto-deploy the update.

---

## Step 3: Test All Applications

### Test Customer App

1. Visit: `https://storemybottle-customer.vercel.app`
2. Try to register a new account
3. Browse venues
4. Check if data loads from API

### Test Bartender App

1. Visit: `https://storemybottle-bartender.vercel.app`
2. Try to login (use bartender credentials)
3. Check dashboard loads
4. Verify API connection

### Test Admin Portal

1. Visit: `https://storemybottle-admin.vercel.app`
2. Login with admin credentials:
   - Email: `admin@storemybottle.com`
   - Password: (the one you set during `create_admin.py`)
3. Check all sections load
4. Verify data from database

---

## 🔍 Troubleshooting

### Build Failed

**Common Issues:**
- Missing dependencies in `package.json`
- TypeScript errors
- Environment variable not set

**Solution:**
1. Check build logs in Vercel dashboard
2. Fix errors locally first
3. Test build locally: `npm run build`
4. Push fix to GitHub
5. Vercel will auto-redeploy

### Blank Page / White Screen

**Causes:**
- API URL is wrong
- CORS not configured
- JavaScript errors

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Verify `VITE_API_URL` is correct
4. Check network tab for failed requests

### API Calls Failing

**Check:**
1. Backend is running on Render
2. `VITE_API_URL` is correct (no trailing slash)
3. CORS is configured on backend
4. Network tab shows correct API URL

**Test API:**
```bash
curl https://storemybottle-api.onrender.com/
```

### 404 on Page Refresh

This is normal for SPAs. Vercel should handle it automatically with the `vercel.json` files we created.

**Verify `vercel.json` exists:**
- `frontend/vercel.json`
- `frontend-bartender/vercel.json`
- `admin/vercel.json`

Each should contain:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🔄 Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes to frontend
git add .
git commit -m "Update frontend"
git push
```

Vercel will:
1. Detect the push
2. Build the project
3. Deploy automatically
4. Update the live site

### View Deployments

Dashboard → Project → **Deployments** tab

---

## 🎨 Custom Domains (Optional)

### Add Custom Domain

1. Buy domain from Namecheap, GoDaddy, etc.
2. Go to Vercel Dashboard → Project → **Settings** → **Domains**
3. Add your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

### Recommended Setup

- Customer: `app.yourdomain.com`
- Bartender: `bartender.yourdomain.com`
- Admin: `admin.yourdomain.com`
- API: Keep on Render or use custom domain there too

---

## 📊 Monitoring

### View Analytics

Dashboard → Project → **Analytics** tab
- Page views
- Unique visitors
- Top pages
- Performance metrics

### View Logs

Dashboard → Project → **Deployments** → Select deployment → **View Logs**

---

## 💰 Free Tier Limits

Vercel Free Tier includes:
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ✅ Preview deployments for PRs
- ✅ Edge network (fast globally)

**More than enough for your app!**

---

## 🎉 Success Checklist

- [ ] Customer app deployed and accessible
- [ ] Bartender app deployed and accessible
- [ ] Admin portal deployed and accessible
- [ ] All apps can connect to backend API
- [ ] CORS configured on backend
- [ ] Can login to all apps
- [ ] Data loads from database
- [ ] All features working

---

## 📝 Your Live URLs

Save these for reference:

```
Backend API:
https://storemybottle-api.onrender.com

Customer App:
https://storemybottle-customer.vercel.app

Bartender App:
https://storemybottle-bartender.vercel.app

Admin Portal:
https://storemybottle-admin.vercel.app
```

---

## 🎊 Congratulations!

Your entire StoreMyBottle platform is now live on the internet!

**What you've accomplished:**
- ✅ Database on Railway
- ✅ Backend API on Render
- ✅ 3 Frontends on Vercel
- ✅ All services connected and working
- ✅ Free hosting for everything!

**Next steps:**
- Share the URLs with users
- Monitor usage and performance
- Add custom domains (optional)
- Set up analytics
- Plan new features

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Check browser console for errors
- Check Vercel deployment logs

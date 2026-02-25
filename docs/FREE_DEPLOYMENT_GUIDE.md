# Free Deployment Guide - Go Live at $0 Cost! 🚀

## 🎯 Goal: Deploy Everything for FREE

We'll deploy:
- ✅ Backend API (Python/FastAPI)
- ✅ Customer Frontend (React)
- ✅ Bartender Frontend (React)
- ✅ Admin Portal (React)
- ✅ MySQL Database

**Total Cost: $0/month** 🎉

---

## 📋 Free Deployment Stack

| Component | Service | Free Tier | Why It's Best |
|-----------|---------|-----------|---------------|
| **Backend** | Render.com | 750 hours/month | Easy Python deployment |
| **Database** | Railway.app | 500 hours/month | Free MySQL, easy setup |
| **Frontends** | Vercel | Unlimited | Best for React, auto-deploy |
| **Domain** | (Optional) | Use provided URLs | Can add custom later |

---

## 🚀 Deployment Plan (Step by Step)

### Phase 1: Database (Railway) - 10 minutes
### Phase 2: Backend (Render) - 15 minutes
### Phase 3: Frontends (Vercel) - 20 minutes
### Phase 4: Testing - 10 minutes

**Total Time: ~55 minutes**

---

## 📊 Phase 1: Deploy Database (Railway)

### Why Railway?
- ✅ Free MySQL database
- ✅ 500 hours/month (enough for 24/7)
- ✅ Easy setup
- ✅ No credit card required initially

### Steps:

**1. Sign Up (2 minutes)**
- Go to railway.app
- Click "Start a New Project"
- Sign up with GitHub (recommended)

**2. Create MySQL Database (3 minutes)**
- Click "New Project"
- Select "Provision MySQL"
- Wait for deployment (~1 minute)

**3. Get Database Credentials (2 minutes)**
- Click on MySQL service
- Go to "Variables" tab
- Copy these values:
  - `MYSQL_HOST`
  - `MYSQL_PORT`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`

**4. Build Connection String (1 minute)**
Format:
```
mysql+pymysql://USER:PASSWORD@HOST:PORT/DATABASE
```

Example:
```
mysql+pymysql://root:abc123@containers-us-west-1.railway.app:7890/railway
```

**5. Initialize Database (2 minutes)**
- Keep Railway tab open
- We'll run migrations after backend is deployed

---

## 🔧 Phase 2: Deploy Backend (Render)

### Why Render?
- ✅ Free tier: 750 hours/month
- ✅ Easy Python deployment
- ✅ Auto-deploy from GitHub
- ✅ Free SSL certificate

### Steps:

**1. Prepare Backend for Deployment (5 minutes)**

Create `render.yaml` in project root:
```yaml
services:
  - type: web
    name: storemybottle-api
    env: python
    region: oregon
    plan: free
    buildCommand: "cd backend && pip install -r requirements.txt"
    startCommand: "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: RESEND_API_KEY
        sync: false
      - key: FROM_EMAIL
        value: onboarding@resend.dev
      - key: FRONTEND_URL
        value: "*"
      - key: ENVIRONMENT
        value: production
```

**2. Push to GitHub (if not already)**
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

**3. Deploy on Render (5 minutes)**
- Go to render.com
- Sign up with GitHub
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Render will detect `render.yaml`
- Click "Apply"

**4. Set Environment Variables (3 minutes)**
In Render dashboard:
- Go to your service
- Click "Environment"
- Add:
  - `DATABASE_URL`: (from Railway)
  - `RESEND_API_KEY`: re_49oNXB8Z_FuYdRhfry9mruG44YEsdQbbE
  - `JWT_SECRET_KEY`: (auto-generated or use your own)

**5. Wait for Deployment (2 minutes)**
- Render will build and deploy
- You'll get a URL like: `https://storemybottle-api.onrender.com`

**6. Run Database Migrations**
In Render dashboard:
- Go to "Shell" tab
- Run:
```bash
cd backend
python init_db.py
```

---

## 🎨 Phase 3: Deploy Frontends (Vercel)

### Why Vercel?
- ✅ Unlimited free deployments
- ✅ Perfect for React/Vite
- ✅ Auto-deploy from GitHub
- ✅ Free SSL + CDN
- ✅ Lightning fast

### Deploy Customer Frontend (7 minutes)

**1. Prepare for Deployment**

Create `vercel.json` in `frontend/` folder:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Update `frontend/.env`:
```env
VITE_API_URL=https://storemybottle-api.onrender.com
```

**2. Deploy to Vercel**
- Go to vercel.com
- Sign up with GitHub
- Click "Add New" → "Project"
- Import your repository
- Select `frontend` folder as root directory
- Click "Deploy"

**3. Get URL**
- You'll get: `https://storemybottle.vercel.app`
- Save this URL

### Deploy Bartender Frontend (5 minutes)

**1. Create vercel.json in `frontend-bartender/`**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**2. Deploy**
- Vercel → "Add New" → "Project"
- Same repository
- Select `frontend-bartender` folder
- Deploy

**3. Get URL**
- You'll get: `https://storemybottle-bartender.vercel.app`

### Deploy Admin Portal (5 minutes)

**1. Create vercel.json in `admin/`**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**2. Deploy**
- Vercel → "Add New" → "Project"
- Same repository
- Select `admin` folder
- Deploy

**3. Get URL**
- You'll get: `https://storemybottle-admin.vercel.app`

---

## ✅ Phase 4: Testing & Verification

### Test Backend
```bash
curl https://storemybottle-api.onrender.com/api/health
```

Should return: `{"status": "healthy"}`

### Test Customer Frontend
1. Go to your Vercel URL
2. Browse venues
3. Try to sign up
4. Test login

### Test Bartender Frontend
1. Go to bartender Vercel URL
2. Try to login
3. Test QR scanning

### Test Admin Portal
1. Go to admin Vercel URL
2. Login as admin
3. Check dashboard

---

## 🎯 Free Tier Limitations

### Railway (Database)
- ✅ 500 hours/month (20 days 24/7)
- ✅ 1GB storage
- ✅ 100GB bandwidth
- ⚠️ Sleeps after 20 days (need to restart)

### Render (Backend)
- ✅ 750 hours/month (31 days 24/7)
- ✅ 512MB RAM
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start: 30-60 seconds

### Vercel (Frontends)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Always on
- ✅ No cold starts

---

## 🔄 Auto-Deploy Setup

### Enable Auto-Deploy
Once connected to GitHub:
- Push to `main` branch
- Vercel auto-deploys frontends
- Render auto-deploys backend
- Zero manual work!

---

## 🌐 Custom Domain (Optional)

### Free Options:
1. **Freenom** - Free .tk, .ml, .ga domains
2. **Use Vercel/Render URLs** - Professional enough

### Paid Option ($12/year):
- Buy from Namecheap/Google Domains
- Add to Vercel/Render
- Professional look

---

## 📊 Monitoring (Free)

### Render Dashboard
- View logs
- Monitor uptime
- Check errors

### Vercel Analytics
- Page views
- Performance
- Errors

### Railway Dashboard
- Database metrics
- Connection count
- Storage usage

---

## 🐛 Common Issues & Solutions

### Backend Cold Start
**Problem:** First request takes 30-60 seconds
**Solution:** 
- Use a free uptime monitor (uptimerobot.com)
- Ping your API every 10 minutes
- Keeps it warm

### Database Connection Errors
**Problem:** Can't connect to Railway
**Solution:**
- Check DATABASE_URL is correct
- Ensure Railway database is running
- Check firewall settings

### CORS Errors
**Problem:** Frontend can't reach backend
**Solution:**
- Set FRONTEND_URL=* in backend
- Or list specific Vercel URLs

### Build Failures
**Problem:** Vercel/Render build fails
**Solution:**
- Check build logs
- Ensure all dependencies in package.json
- Verify Node version

---

## 💰 Cost Breakdown

### Current (Free)
- Railway: $0
- Render: $0
- Vercel: $0
- **Total: $0/month**

### When You Outgrow Free Tier
- Railway: $5/month (always-on database)
- Render: $7/month (always-on backend)
- Vercel: Still free!
- **Total: $12/month**

---

## 🚀 Next Steps After Deployment

1. **Test Everything**
   - All user flows
   - All portals
   - All features

2. **Monitor Performance**
   - Check response times
   - Monitor errors
   - Track usage

3. **Share with Users**
   - Get feedback
   - Fix issues
   - Iterate

4. **Upgrade When Needed**
   - More users = paid tier
   - Better performance
   - No cold starts

---

## 📝 Deployment Checklist

- [ ] Railway account created
- [ ] MySQL database deployed
- [ ] Database credentials saved
- [ ] Render account created
- [ ] Backend deployed on Render
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Vercel account created
- [ ] Customer frontend deployed
- [ ] Bartender frontend deployed
- [ ] Admin portal deployed
- [ ] All URLs saved
- [ ] Backend tested
- [ ] Frontends tested
- [ ] End-to-end flow tested

---

## 🎉 You're Live!

Once deployed, you'll have:
- ✅ Live backend API
- ✅ Live customer app
- ✅ Live bartender app
- ✅ Live admin portal
- ✅ All for FREE!

**Ready to start? Let's do this step by step!**

Which service should we start with?
1. Railway (Database) - Easiest
2. Render (Backend) - Most important
3. Vercel (Frontends) - Quickest

Let me know and I'll guide you through each step! 🚀

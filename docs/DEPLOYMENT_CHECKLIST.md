# Deployment Checklist ✅

## Pre-Deployment
- [x] All code committed to GitHub
- [x] Configuration files created (render.yaml, vercel.json)
- [x] Environment variables documented
- [x] Database migrations ready

## Step 1: Database (Railway)
- [ ] Sign up at railway.app
- [ ] Create new project
- [ ] Provision MySQL database
- [ ] Copy connection string
- [ ] Save DATABASE_URL: `_______________________________`

## Step 2: Backend (Render)
- [ ] Sign up at render.com
- [ ] Create new web service
- [ ] Connect GitHub repository
- [ ] Set environment variables:
  - [ ] DATABASE_URL (from Railway)
  - [ ] RESEND_API_KEY
  - [ ] JWT_SECRET_KEY (auto-generated)
- [ ] Wait for deployment
- [ ] Run database migrations (`python init_db.py`)
- [ ] Test API endpoint
- [ ] Save Backend URL: `_______________________________`

## Step 3: Customer Frontend (Vercel)
- [ ] Sign up at vercel.com
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Add VITE_API_URL environment variable
- [ ] Deploy
- [ ] Test customer app
- [ ] Save URL: `_______________________________`

## Step 4: Bartender Frontend (Vercel)
- [ ] Create new Vercel project
- [ ] Same repository
- [ ] Set root directory to `frontend-bartender`
- [ ] Add VITE_API_URL environment variable
- [ ] Deploy
- [ ] Test bartender app
- [ ] Save URL: `_______________________________`

## Step 5: Admin Portal (Vercel)
- [ ] Create new Vercel project
- [ ] Same repository
- [ ] Set root directory to `admin`
- [ ] Add VITE_API_URL environment variable
- [ ] Deploy
- [ ] Test admin portal
- [ ] Save URL: `_______________________________`

## Post-Deployment Testing
- [ ] Backend health check works
- [ ] Customer app loads
- [ ] Can browse venues
- [ ] Can sign up/login
- [ ] Bartender app loads
- [ ] Can login as bartender
- [ ] Admin portal loads
- [ ] Can login as admin
- [ ] Password reset email works
- [ ] QR code scanning works
- [ ] All API endpoints respond

## Optional Enhancements
- [ ] Setup uptime monitoring (uptimerobot.com)
- [ ] Add custom domain
- [ ] Verify domain in Resend
- [ ] Enable analytics
- [ ] Setup error tracking

## URLs to Save
```
Database: _______________________________
Backend:  _______________________________
Customer: _______________________________
Bartender: _______________________________
Admin:    _______________________________
```

## Credentials to Save
```
Railway:
- Email: _______________________________
- Password: _______________________________

Render:
- Email: _______________________________
- Password: _______________________________

Vercel:
- Email: _______________________________
- Password: _______________________________
```

## 🎉 Deployment Complete!
- [ ] All services deployed
- [ ] All URLs saved
- [ ] All credentials saved
- [ ] Everything tested
- [ ] Ready to share with users!

---

**Date Deployed:** _______________________________
**Deployed By:** _______________________________
**Status:** _______________________________

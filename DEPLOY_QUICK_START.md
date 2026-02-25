# 🚀 Deploy StoreMyBottle - Quick Start

## Your Credentials

**Railway Database:**
```
mysql://root:nSeiUCOdAZKJdosMIpvSdqfYRoeyhjNZ@switchyard.proxy.rlwy.net:12410/railway
```

---

## 3-Step Deployment

### Step 1: Deploy Backend (Render) - 10 minutes

1. Go to https://render.com/dashboard
2. New + → Web Service → Connect `anishghanwat/StoreMyBottleApp`
3. Configure:
   - Name: `storemybottle-api`
   - Root Directory: `backend`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   ```
   DATABASE_URL=mysql://root:nSeiUCOdAZKJdosMIpvSdqfYRoeyhjNZ@switchyard.proxy.rlwy.net:12410/railway
   JWT_SECRET_KEY=storemybottle-super-secret-jwt-key-production-2026-change-this
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   RESEND_API_KEY=re_49oNXB8Z_FuYdRhfry9mruG44YEsdQbbE
   FROM_EMAIL=onboarding@resend.dev
   FRONTEND_URL=*
   ENVIRONMENT=production
   ```
5. Deploy → Wait 5-10 minutes
6. Open Shell → Run:
   ```bash
   python init_db.py
   python create_admin.py
   ```

**Your API:** `https://storemybottle-api.onrender.com`

---

### Step 2: Deploy Customer Frontend (Vercel) - 3 minutes

1. Go to https://vercel.com/new
2. Import `anishghanwat/StoreMyBottleApp`
3. Configure:
   - Name: `storemybottle-customer`
   - Root Directory: `frontend`
   - Framework: Vite
4. Add Environment Variable:
   ```
   VITE_API_URL=https://storemybottle-api.onrender.com
   ```
5. Deploy

**Your App:** `https://storemybottle-customer.vercel.app`

---

### Step 3: Deploy Bartender & Admin (Vercel) - 6 minutes

**Bartender:**
1. Vercel → New → Import same repo
2. Name: `storemybottle-bartender`
3. Root Directory: `frontend-bartender`
4. Environment Variable: `VITE_API_URL=https://storemybottle-api.onrender.com`
5. Deploy

**Admin:**
1. Vercel → New → Import same repo
2. Name: `storemybottle-admin`
3. Root Directory: `admin`
4. Environment Variable: `VITE_API_URL=https://storemybottle-api.onrender.com`
5. Deploy

---

## ✅ Test Your Deployment

1. **Backend:** Visit `https://storemybottle-api.onrender.com/docs`
2. **Customer:** Visit your Vercel URL → Try to register
3. **Bartender:** Visit your Vercel URL → Try to login
4. **Admin:** Visit your Vercel URL → Login with admin credentials

---

## 📚 Detailed Guides

- **Render Setup:** `docs/RENDER_SETUP_GUIDE.md`
- **Vercel Setup:** `docs/VERCEL_SETUP_GUIDE.md`
- **Troubleshooting:** `docs/RENDER_DEPLOYMENT_FIX.md`
- **Full Guide:** `docs/FREE_DEPLOYMENT_GUIDE.md`

---

## 🆘 Issues?

**Backend won't start:**
- Check Render logs
- Verify DATABASE_URL is correct
- Ensure all environment variables are set

**Frontend blank page:**
- Check browser console (F12)
- Verify VITE_API_URL is correct
- Check if backend is running

**API calls failing:**
- Update CORS on backend with frontend URLs
- Check network tab in browser
- Verify backend is accessible

---

## 🎉 Done!

Your app is live! Total time: ~20 minutes

**Next:**
- Share URLs with users
- Add custom domains (optional)
- Monitor usage
- Plan new features

---

**Created:** February 25, 2026

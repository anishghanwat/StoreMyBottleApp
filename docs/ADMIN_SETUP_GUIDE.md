# Admin Panel Setup Guide

## Quick Start

### 1. Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies (if not done)
pip install -r requirements.txt

# Initialize database
python init_db.py

# Create admin user
python create_admin.py admin@storemybottle.com admin123

# Start backend server (HTTP)
uvicorn main:app --reload --port 8000
```

### 2. Setup Admin Panel

```bash
# Navigate to admin panel (in a new terminal)
cd admin

# Install dependencies (if not done)
npm install

# Start admin panel
npm run dev
```

### 3. Login

Open your browser to the admin panel URL (usually `http://localhost:5173`)

**Login Credentials:**
- **Email:** `admin@storemybottle.com`
- **Password:** `admin123`

---

## Troubleshooting

### Error: ERR_SSL_PROTOCOL_ERROR

**Problem:** Admin panel trying to connect via HTTPS but backend is running HTTP.

**Solution:** 
1. Make sure backend is running: `uvicorn main:app --reload --port 8000`
2. Check `admin/.env` file has: `VITE_API_URL=http://localhost:8000`
3. Restart admin panel: Stop (Ctrl+C) and run `npm run dev` again

### Error: Network Error / Connection Refused

**Problem:** Backend is not running.

**Solution:** Start the backend server:
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Error: 401 Unauthorized

**Problem:** Admin user doesn't exist or wrong credentials.

**Solution:** Create/recreate admin user:
```bash
cd backend
python create_admin.py admin@storemybottle.com admin123
```

### Error: Database Connection Failed

**Problem:** MySQL is not running or wrong credentials.

**Solution:** 
1. Check if MySQL is running
2. Verify `backend/.env` has correct DATABASE_URL
3. See `MYSQL_TROUBLESHOOTING.md` for detailed help

---

## Custom Admin Credentials

To create admin with custom credentials:

```bash
cd backend
python create_admin.py your-email@example.com your-password
```

Then login with those credentials.

---

## Environment Configuration

### Backend (`backend/.env`)
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/storemybottle
JWT_SECRET_KEY=your-secret-key
ENVIRONMENT=development
```

### Admin Panel (`admin/.env`)
```env
VITE_API_URL=http://localhost:8000
```

---

## Production Deployment

For production, update:

1. **Backend:** Run with HTTPS (use nginx/caddy as reverse proxy)
2. **Admin Panel:** Update `admin/.env`:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```
3. **Build admin panel:**
   ```bash
   cd admin
   npm run build
   ```

---

## Default Test Users

After running `init_db.py`, you get:

**Test Customer (NOT for admin panel):**
- Email: `test@storemybottle.com`
- Phone: `+919876543210`
- Role: Customer

**Admin User (create manually):**
- Run: `python create_admin.py admin@storemybottle.com admin123`
- Email: `admin@storemybottle.com`
- Password: `admin123`
- Role: Admin

---

## Verification Steps

1. ✅ Backend running on http://localhost:8000
2. ✅ Admin panel running on http://localhost:5173
3. ✅ Can access http://localhost:8000/docs (Swagger UI)
4. ✅ Can login to admin panel
5. ✅ Can see dashboard with stats
6. ✅ Can navigate to Venues, Bottles, Users pages

---

## Next Steps

Once logged in, you can:
- View dashboard analytics
- Manage venues (create, edit, delete)
- Manage bottles inventory (create, edit, delete)
- View and manage users
- Assign bartender roles to users

---

## Support

If you encounter issues:
1. Check backend logs in terminal
2. Check browser console for errors
3. Verify all services are running
4. Check environment variables are correct

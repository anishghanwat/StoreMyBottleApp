# 🏠 Running StoreMyBottle Locally

Complete guide to run the entire application on localhost.

---

## 📋 Prerequisites

- Python 3.11+
- Node.js 18+
- MySQL 8.0+ (or use Docker for MySQL)

---

## 🗄️ Step 1: Start MySQL Database

### Option A: Using Docker (Recommended)
```bash
docker-compose up db -d
```

### Option B: Local MySQL
Make sure MySQL is running on `localhost:3306`

---

## 🔧 Step 2: Configure Backend

### 1. Navigate to backend folder
```bash
cd backend
```

### 2. Create/Update `.env` file
```env
DATABASE_URL=mysql+pymysql://storemybottle_user:storemybottle_pass@localhost:3306/storemybottle
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESEND_API_KEY=re_49oNXB8Z_FuYdRhfry9mruG44YEsdQbbE
FROM_EMAIL=onboarding@resend.dev
RESEND_TEST_EMAIL=anishghanwat9@gmail.com
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### 3. Install Python dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize database
```bash
python init_db.py
```

### 5. Create admin user
```bash
python create_admin.py admin@storemybottle.com admin123
```

### 6. Start backend server
```bash
python main.py
```

Backend will run on: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

---

## 🎨 Step 3: Start Frontend Applications

Open 3 separate terminal windows:

### Terminal 1: Customer Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on: **http://localhost:5173**

### Terminal 2: Bartender Frontend
```bash
cd frontend-bartender
npm install
npm run dev
```
Runs on: **http://localhost:5174**

### Terminal 3: Admin Portal
```bash
cd admin
npm install
npm run dev
```
Runs on: **http://localhost:5175**

---

## ✅ Verify Everything is Running

1. **Backend API:** http://localhost:8000/docs
2. **Customer App:** http://localhost:5173
3. **Bartender App:** http://localhost:5174
4. **Admin Portal:** http://localhost:5175

---

## 🔐 Default Credentials

### Admin Login
- Email: `admin@storemybottle.com`
- Password: `admin123`

### Create Test Bartender (Optional)
```bash
cd backend
python seed_bartender.py
```
- Email: `bartender@storemybottle.com`
- Password: `password123`

---

## 🐛 Troubleshooting

### Backend won't start

**Error: "Can't connect to MySQL server"**
```bash
# Check if MySQL is running
docker-compose ps

# Or check local MySQL
mysql -u root -p
```

**Error: "Database doesn't exist"**
```bash
cd backend
python init_db.py
```

### Frontend won't start

**Error: "Port already in use"**
```bash
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Error: "Module not found"**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API calls failing

**Check CORS settings in `backend/main.py`:**
```python
allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
]
```

---

## 🚀 Quick Start (All at Once)

### Using Docker Compose
```bash
# Start everything
docker-compose up -d

# Initialize database
docker-compose exec backend python init_db.py
docker-compose exec backend python create_admin.py admin@storemybottle.com admin123

# View logs
docker-compose logs -f
```

Access:
- Customer: http://localhost:5173
- Bartender: http://localhost:5174
- Admin: http://localhost:5175
- API: http://localhost:8000

### Stop Everything
```bash
docker-compose down
```

---

## 📝 Development Workflow

### Making Changes

**Backend changes:**
- Edit Python files
- Server auto-reloads (uvicorn --reload)

**Frontend changes:**
- Edit React/TypeScript files
- Vite auto-reloads in browser

### Testing

**Test API endpoints:**
```bash
# Visit API docs
http://localhost:8000/docs

# Or use curl
curl http://localhost:8000/api/venues
```

**Test authentication:**
1. Go to admin portal: http://localhost:5175
2. Login with admin credentials
3. Check if dashboard loads

---

## 🔄 Reset Database

```bash
cd backend

# Drop and recreate all tables
python init_db.py

# Recreate admin user
python create_admin.py admin@storemybottle.com admin123

# Add test data (optional)
python seed_bartender.py
python add_pune_venues.py
```

---

## 📊 Database Access

### Using MySQL CLI
```bash
# Connect to database
mysql -u storemybottle_user -p storemybottle

# Or with Docker
docker-compose exec db mysql -u storemybottle_user -p storemybottle
```

### Common Queries
```sql
-- View all users
SELECT id, email, name, role FROM users;

-- View all venues
SELECT id, name, location FROM venues;

-- View purchases
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 10;
```

---

## 🎯 Next Steps

Once everything is running locally:

1. ✅ Test all features
2. ✅ Create test data
3. ✅ Test on mobile devices (use your local IP)
4. ✅ Fix any bugs
5. ✅ Prepare for AWS deployment

---

## 📱 Testing on Mobile (Same Network)

### Find your local IP:
```bash
# Windows
ipconfig

# Look for IPv4 Address (e.g., 192.168.1.100)
```

### Update backend CORS:
Add your IP to `backend/main.py`:
```python
allow_origins=[
    "http://localhost:5173",
    "http://192.168.1.100:5173",  # Your IP
]
```

### Access from mobile:
- Customer: `http://192.168.1.100:5173`
- Bartender: `http://192.168.1.100:5174`
- Admin: `http://192.168.1.100:5175`

---

## 💡 Tips

- Use **Docker Compose** for easiest setup
- Keep terminals open to see logs
- Use **API docs** at `/docs` for testing
- Check browser console for frontend errors
- Use **Postman** or **Thunder Client** for API testing

---

**Ready to start? Run:**
```bash
docker-compose up -d
```

Then visit http://localhost:5173 🚀

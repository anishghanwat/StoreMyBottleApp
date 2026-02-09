# Quick Start Guide - Local Development

Since you already have MySQL running locally on port 3306, let's use that instead of Docker.

## Setup Steps

### 1. Create Database

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE storemybottle;
exit;
```

### 2. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 3. Initialize Database

```bash
# Make sure you're in the backend directory
python init_db.py
```

### 4. Start Backend Server

```bash
uvicorn main:app --reload --port 8000
```

### 5. Access API

- **Swagger UI**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Frontend Setup

The frontend is already set up with Vite. To run it:

```bash
cd frontend
npm install  # if not already done
npm run dev
```

Frontend will be available at: http://localhost:5173

## Testing the API

1. Open http://localhost:8000/docs
2. Try the `/api/venues` endpoint to see the seeded venues
3. Test authentication with phone/OTP (OTP will print in console in dev mode)

## Troubleshooting

### Database Connection Error

If you get a database connection error, update `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/storemybottle
```

Replace `YOUR_PASSWORD` with your MySQL root password.

### Port Already in Use

If port 8000 is in use:
```bash
uvicorn main:app --reload --port 8001
```

Then update CORS in `backend/main.py` if needed.

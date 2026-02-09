# MySQL Connection Troubleshooting Guide

## Issue
`python init_db.py` is failing with: "Connection refused" error

This means either:
1. MySQL is not running
2. MySQL credentials are incorrect
3. MySQL is running on a different port

## Solutions

### Option 1: Start MySQL Service (Windows)

```powershell
# Check if MySQL is running
Get-Service -Name MySQL* | Select-Object Name, Status

# If not running, start it
Start-Service -Name MySQL80  # or MySQL57, check the actual service name
```

### Option 2: Use Docker MySQL (Simpler)

Since Docker MySQL was working before, let's use just the database from Docker:

```bash
# Start only MySQL from Docker
docker-compose up -d db

# Wait 10 seconds for MySQL to start
# Then run init_db.py with updated .env
```

Update `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://storemybottle_user:storemybottle_pass@localhost:3306/storemybottle
```

### Option 3: Check MySQL Installation

If MySQL isn't installed locally, you have two choices:

**A. Install MySQL:**
- Download from: https://dev.mysql.com/downloads/installer/
- Or use: `winget install Oracle.MySQL`

**B. Use Docker MySQL (Recommended):**
```bash
docker-compose up -d db
```

## Quick Test

After starting MySQL, test the connection:

```bash
# If using local MySQL
mysql -u root -p
# Enter your password

# If using Docker MySQL
docker exec -it storemybottle_db mysql -u storemybottle_user -p
# Password: storemybottle_pass
```

## Next Steps

Once MySQL is running:

```bash
cd backend
python init_db.py
uvicorn main:app --reload --port 8000
```

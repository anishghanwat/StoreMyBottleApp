# StoreMyBottle Deployment Guide

## Prerequisites
- **Docker** and **Docker Compose** installed.
- **Node.js** (for local frontend build, optional if using Docker).
- **Python 3.11+** (for local backend, optional if using Docker).

## 1. Environment Configuration

### Backend
Create `backend/.env` based on `backend/.env.example`:
```ini
DATABASE_URL=mysql+pymysql://user:pass@db:3306/storemybottle
JWT_SECRET_KEY=your-production-secret-key
ENVIRONMENT=production
FRONTEND_URL=https://your-domain.com
```

### Frontend
Create `frontend/.env` based on `frontend/.env.example`:
```ini
VITE_API_URL=https://api.your-domain.com
```

## 2. Docker Deployment

Run the entire stack (Database + Backend + Frontend Proxy?):

```bash
docker-compose up -d --build
```
*Note: The current `docker-compose.yml` sets up MySQL and Backend. You may need to configure a web server (Nginx) to serve the frontend static files and proxy API requests.*

## 3. Database Migration
The `backend` container will auto-create tables on startup via `models.Base.metadata.create_all(bind=engine)`.
To seed initial data (venues/bottles):
```bash
docker-compose exec backend python init_db.py
```

## 4. Verification
Run the automated test script against the deployed backend (ensure `ENVIRONMENT=development` if you want to use the test script's OTP backdoor, otherwise use real OTPs):
```bash
docker-compose exec backend python verify_flow.py
```

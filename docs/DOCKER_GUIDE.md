# 🐳 Docker Deployment Guide

Complete guide for running StoreMyBottle with Docker.

## 📋 Prerequisites

- Docker Desktop installed and running
- At least 4GB RAM available
- Ports available: 3306, 5173-5175, 8000 (dev) or 80-82, 8000 (prod)

## 🚀 Quick Start

### Development Mode

```bash
# Start all services
docker-start.bat

# Or manually
docker-compose up --build -d
```

Access the applications:
- Customer App: http://localhost:5173
- Bartender App: http://localhost:5174
- Admin Portal: http://localhost:5175
- Backend API: http://localhost:8000

### Production Mode

```bash
# First time setup
copy .env.docker .env.production
# Edit .env.production with your actual values

# Start production services
docker-start.bat prod

# Or manually
docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
```

Access the applications:
- Customer App: http://localhost:80
- Bartender App: http://localhost:81
- Admin Portal: http://localhost:82
- Backend API: http://localhost:8000

## 📦 Services Overview

### 1. Database (MySQL 8.0)
- Container: `storemybottle_db`
- Port: 3306
- Volume: `mysql_data` (persistent storage)
- Health check: MySQL ping every 30s

### 2. Backend API (FastAPI)
- Container: `storemybottle_backend`
- Port: 8000
- Dependencies: Database
- Auto-reload: Enabled in dev mode
- Workers: 4 in production mode

### 3. Customer Frontend (React + Vite)
- Container: `storemybottle_frontend`
- Port: 5173 (dev) / 80 (prod)
- Server: Vite dev server (dev) / Nginx (prod)

### 4. Bartender Frontend (React + Vite)
- Container: `storemybottle_bartender`
- Port: 5174 (dev) / 81 (prod)
- Server: Vite dev server (dev) / Nginx (prod)

### 5. Admin Portal (React + Vite)
- Container: `storemybottle_admin`
- Port: 5175 (dev) / 82 (prod)
- Server: Vite dev server (dev) / Nginx (prod)

## 🔧 Common Commands

### Starting Services

```bash
# Development mode
docker-compose up -d

# Production mode
docker-compose -f docker-compose.prod.yml up -d

# With rebuild
docker-compose up --build -d

# View logs while starting
docker-compose up
```

### Stopping Services

```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (⚠️ deletes database)
docker-compose down -v

# Using helper script
docker-stop.bat
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Container Management

```bash
# List running containers
docker-compose ps

# Restart a service
docker-compose restart backend

# Rebuild a specific service
docker-compose up -d --build backend

# Execute command in container
docker-compose exec backend python init_db.py
docker-compose exec backend python create_admin.py
```

### Database Management

```bash
# Access MySQL shell
docker-compose exec db mysql -u storemybottle_user -p storemybottle

# Backup database
docker-compose exec db mysqldump -u storemybottle_user -p storemybottle > backup.sql

# Restore database
docker-compose exec -T db mysql -u storemybottle_user -p storemybottle < backup.sql
```

## 🔍 Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead
```

### Database Connection Issues

```bash
# Check database health
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait for database to be ready
docker-compose exec backend python -c "from database import engine; engine.connect()"
```

### Frontend Not Loading

```bash
# Check if container is running
docker-compose ps frontend

# View logs
docker-compose logs frontend

# Rebuild frontend
docker-compose up -d --build frontend

# Clear browser cache and reload
```

### Backend API Errors

```bash
# View backend logs
docker-compose logs -f backend

# Check environment variables
docker-compose exec backend env | grep DATABASE_URL

# Restart backend
docker-compose restart backend

# Run database migrations
docker-compose exec backend python init_db.py
```

### Container Won't Start

```bash
# Remove all containers and volumes
docker-compose down -v

# Remove dangling images
docker image prune -f

# Rebuild from scratch
docker-compose up --build -d

# Check Docker resources (RAM, disk space)
docker system df
```

## 🔐 Environment Variables

### Development (.env in docker-compose.yml)
- Hardcoded for easy local development
- Not secure for production
- Database: `storemybottle_user` / `storemybottle_pass`

### Production (.env.production)
- Must be created from `.env.docker` template
- Use strong passwords
- Never commit to version control
- Required variables:
  - `MYSQL_ROOT_PASSWORD`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `JWT_SECRET_KEY` (min 32 characters)
  - `RESEND_API_KEY`
  - `FROM_EMAIL`
  - `FRONTEND_URL`
  - `VITE_API_URL`

## 📊 Monitoring

### Health Checks

```bash
# Check all services health
docker-compose ps

# Backend health endpoint
curl http://localhost:8000/

# Database health
docker-compose exec db mysqladmin ping -h localhost
```

### Resource Usage

```bash
# View resource usage
docker stats

# View disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

## 🚢 Deployment

### Local Production Test

```bash
# 1. Create production env file
copy .env.docker .env.production

# 2. Edit with actual values
notepad .env.production

# 3. Start production stack
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 4. Initialize database
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
docker-compose -f docker-compose.prod.yml exec backend python create_admin.py

# 5. Test all endpoints
```

### Cloud Deployment

See `FREE_DEPLOYMENT_GUIDE.md` for:
- Render.com deployment
- Railway.app deployment
- Fly.io deployment
- Vercel frontend deployment

## 🔄 Updates and Maintenance

### Updating Code

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up --build -d

# Or for production
docker-compose -f docker-compose.prod.yml up --build -d
```

### Database Migrations

```bash
# Run migration script
docker-compose exec backend python migrate_script.py

# Or create new migration
docker-compose exec backend python add_columns.py
```

### Backup Strategy

```bash
# Daily database backup
docker-compose exec db mysqldump -u storemybottle_user -p storemybottle > backup_$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v storemybottle_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

## 📝 Best Practices

1. **Development**
   - Use `docker-compose.yml` for local development
   - Enable hot reload for faster iteration
   - Mount volumes for code changes

2. **Production**
   - Use `docker-compose.prod.yml`
   - Set strong passwords in `.env.production`
   - Use nginx for serving static files
   - Enable health checks
   - Set resource limits

3. **Security**
   - Never commit `.env.production`
   - Use secrets management in cloud
   - Run containers as non-root user
   - Keep images updated
   - Use specific image versions

4. **Performance**
   - Use `.dockerignore` to reduce build context
   - Multi-stage builds for smaller images
   - Use build cache effectively
   - Set appropriate resource limits

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify all containers are running: `docker-compose ps`
3. Check environment variables: `docker-compose config`
4. Restart services: `docker-compose restart`
5. Rebuild from scratch: `docker-compose down -v && docker-compose up --build -d`

For more help, see:
- `FREE_DEPLOYMENT_GUIDE.md` - Deployment options
- `DEPLOY_NOW.md` - Quick deployment guide
- `DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist

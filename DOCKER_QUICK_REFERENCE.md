# 🐳 Docker Quick Reference

## 🚀 Starting Services

```bash
# Development mode (hot reload)
docker-start.bat
# OR
docker-compose up -d

# Production mode
docker-start.bat prod
# OR
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# With logs visible
docker-compose up
```

## 🛑 Stopping Services

```bash
# Stop all
docker-stop.bat
# OR
docker-compose down

# Stop and remove volumes (⚠️ deletes database)
docker-compose down -v
```

## 📋 Viewing Status

```bash
# List running containers
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

## 🔄 Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build backend
```

## 🗄️ Database Commands

```bash
# Access MySQL shell
docker-compose exec db mysql -u storemybottle_user -p storemybottle

# Initialize database
docker-compose exec backend python init_db.py

# Create admin user
docker-compose exec backend python create_admin.py

# Backup database
docker-compose exec db mysqldump -u storemybottle_user -p storemybottle > backup.sql

# Restore database
docker-compose exec -T db mysql -u storemybottle_user -p storemybottle < backup.sql
```

## 🔧 Troubleshooting

```bash
# View all container details
docker-compose ps -a

# Check container logs
docker-compose logs backend

# Execute command in container
docker-compose exec backend bash

# Rebuild from scratch
docker-compose down -v
docker-compose up --build -d

# Check Docker resources
docker system df

# Clean up unused resources
docker system prune -a
```

## 🌐 Access URLs

### Development
- Customer: http://localhost:5173
- Bartender: http://localhost:5174
- Admin: http://localhost:5175
- API: http://localhost:8000

### Production
- Customer: http://localhost:80
- Bartender: http://localhost:81
- Admin: http://localhost:82
- API: http://localhost:8000

## 📦 Useful Commands

```bash
# View environment variables
docker-compose config

# Scale a service
docker-compose up -d --scale backend=3

# Pull latest images
docker-compose pull

# Build without cache
docker-compose build --no-cache

# Remove stopped containers
docker-compose rm

# View resource usage
docker stats
```

## 🔐 First Time Setup

```bash
# 1. Start services
docker-compose up -d

# 2. Wait for database (check logs)
docker-compose logs -f db

# 3. Initialize database
docker-compose exec backend python init_db.py

# 4. Create admin user
docker-compose exec backend python create_admin.py

# 5. Access applications
# Customer: http://localhost:5173
# Bartender: http://localhost:5174
# Admin: http://localhost:5175
```

## 📚 More Help

- Full guide: `docs/DOCKER_GUIDE.md`
- Deployment: `docs/FREE_DEPLOYMENT_GUIDE.md`
- Troubleshooting: `docs/DOCKER_GUIDE.md#troubleshooting`

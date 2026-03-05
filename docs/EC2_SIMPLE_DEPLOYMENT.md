# EC2 Simple Deployment - Docker Compose

## 🚀 Get Your App Live in 30 Minutes

Deploy StoreMyBottle on a single EC2 instance using Docker Compose. Perfect for testing, demos, or small-scale production.

---

## 💰 Cost

**~$10-30/month** depending on instance size:
- t3.small (2GB RAM): ~$15/month - Recommended minimum
- t3.medium (4GB RAM): ~$30/month - Recommended for production
- t3.micro (1GB RAM): ~$8/month - Free tier eligible (testing only)

---

## 📋 Prerequisites

- AWS account
- Domain name (optional, can use IP address)
- 30 minutes of your time

---

## Step 1: Launch EC2 Instance (10 minutes)

### 1.1 Go to EC2 Console
1. Log in to [AWS Console](https://console.aws.amazon.com/)
2. Navigate to EC2
3. Click "Launch Instance"

### 1.2 Configure Instance

**Name**: `storemybottle-server`

**AMI**: Ubuntu Server 22.04 LTS (Free tier eligible)

**Instance Type**: 
- Testing: `t3.micro` (1GB RAM) - Free tier
- Production: `t3.small` (2GB RAM) or `t3.medium` (4GB RAM)

**Key Pair**: 
- Create new key pair
- Name: `storemybottle-key`
- Type: RSA
- Format: .pem
- Download and save securely

**Network Settings**:
- Create security group: `storemybottle-sg`
- Allow SSH (port 22) from your IP
- Allow HTTP (port 80) from anywhere
- Allow Custom TCP (port 8000) from anywhere - Backend API
- Allow Custom TCP (port 8080) from anywhere - Bartender app
- Allow Custom TCP (port 8081) from anywhere - Admin panel

**Storage**: 
- 20 GB gp3 (minimum)
- 30 GB recommended for production

**Click "Launch Instance"**

### 1.3 Note Your Public IP
```bash
# After instance starts, note the Public IPv4 address
# Example: 54.123.45.67
```

---

## Step 2: Connect to EC2 (5 minutes)

### 2.1 SSH into Instance

**Windows (PowerShell)**:
```powershell
# Set permissions on key file
icacls storemybottle-key.pem /inheritance:r
icacls storemybottle-key.pem /grant:r "%username%:R"

# Connect
ssh -i storemybottle-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Mac/Linux**:
```bash
# Set permissions
chmod 400 storemybottle-key.pem

# Connect
ssh -i storemybottle-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 3: Install Docker (5 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
# Then SSH back in
ssh -i storemybottle-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 4: Clone and Configure (5 minutes)

### 4.1 Clone Repository
```bash
# Clone your repo
git clone https://github.com/anishghanwat/StoreMyBottleApp.git
cd StoreMyBottleApp
```

### 4.2 Configure Environment
```bash
# Copy production environment template
cp .env.production .env

# Edit environment file
nano .env
```

**Update these values in .env**:
```bash
# Database passwords (use strong passwords!)
MYSQL_ROOT_PASSWORD=YourStrongRootPassword123!
MYSQL_PASSWORD=YourStrongDBPassword456!

# JWT secrets (generate with: openssl rand -base64 48)
JWT_SECRET=<paste_generated_secret_here>
JWT_REFRESH_SECRET=<paste_another_generated_secret_here>

# Replace YOUR_EC2_PUBLIC_IP with your actual IP
API_URL=http://54.123.45.67:8000
CORS_ORIGINS=http://54.123.45.67,http://54.123.45.67:8080,http://54.123.45.67:8081
```

**Generate JWT secrets**:
```bash
# Generate secrets
openssl rand -base64 48
# Copy output and paste as JWT_SECRET

openssl rand -base64 48
# Copy output and paste as JWT_REFRESH_SECRET
```

**Save and exit**: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: Deploy with Docker Compose (5 minutes)

### 5.1 Build and Start
```bash
# Build and start all services
docker-compose -f docker-compose.prod.simple.yml --env-file .env up -d --build

# This will take 5-10 minutes on first run
# Watch the progress
docker-compose -f docker-compose.prod.simple.yml logs -f
```

### 5.2 Wait for Services to Start
```bash
# Check status
docker-compose -f docker-compose.prod.simple.yml ps

# All services should show "Up" status
```

### 5.3 Initialize Database
```bash
# Run database initialization
docker exec storemybottle_backend python init_db.py

# Create admin user
docker exec storemybottle_backend python create_admin.py
```

---

## Step 6: Test Your Deployment (5 minutes)

### 6.1 Test Backend API
```bash
# From your local machine
curl http://YOUR_EC2_PUBLIC_IP:8000/health

# Should return: {"status":"healthy"}

# Open API docs in browser
# http://YOUR_EC2_PUBLIC_IP:8000/docs
```

### 6.2 Test Frontends

Open in your browser:
- **Customer App**: `http://YOUR_EC2_PUBLIC_IP`
- **Bartender App**: `http://YOUR_EC2_PUBLIC_IP:8080`
- **Admin Panel**: `http://YOUR_EC2_PUBLIC_IP:8081`

### 6.3 Login to Admin Panel
```
URL: http://YOUR_EC2_PUBLIC_IP:8081
Email: admin@storemybottle.com
Password: admin123
```

---

## 🎉 You're Live!

Your app is now running on EC2! Here's what you have:

- ✅ Backend API on port 8000
- ✅ Customer app on port 80
- ✅ Bartender app on port 8080
- ✅ Admin panel on port 8081
- ✅ MySQL database (persistent storage)
- ✅ Auto-restart on reboot

---

## 📊 Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.simple.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.simple.yml logs -f backend
docker-compose -f docker-compose.prod.simple.yml logs -f frontend
```

### Check Status
```bash
# Service status
docker-compose -f docker-compose.prod.simple.yml ps

# Resource usage
docker stats
```

### Restart Services
```bash
# Restart all
docker-compose -f docker-compose.prod.simple.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.simple.yml restart backend
```

---

## 🔄 Update Your App

### Method 1: Pull Latest Code
```bash
# SSH into EC2
cd StoreMyBottleApp

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.prod.simple.yml up -d --build
```

### Method 2: Manual Upload
```bash
# From your local machine
scp -i storemybottle-key.pem -r ./backend ubuntu@YOUR_EC2_IP:~/StoreMyBottleApp/

# Then SSH in and restart
docker-compose -f docker-compose.prod.simple.yml restart backend
```

---

## 🔐 Security Improvements

### 1. Use HTTPS (Recommended)

**Option A: Use Cloudflare (Free)**
1. Add your domain to Cloudflare
2. Point A records to your EC2 IP
3. Enable "Full" SSL mode
4. Cloudflare provides free SSL certificate

**Option B: Use Let's Encrypt**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d yourdomain.com
```

### 2. Restrict SSH Access
```bash
# Edit security group in AWS Console
# Change SSH (port 22) from "0.0.0.0/0" to "Your IP only"
```

### 3. Enable Firewall
```bash
# Enable UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 8000/tcp
sudo ufw allow 8080/tcp
sudo ufw allow 8081/tcp
sudo ufw enable
```

### 4. Set Up Automatic Backups
```bash
# Create backup script
cat > ~/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec storemybottle_db mysqldump -u root -p$MYSQL_ROOT_PASSWORD storemybottle > backup_$DATE.sql
# Upload to S3 (optional)
# aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
EOF

chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup.sh") | crontab -
```

---

## 💡 Performance Optimization

### 1. Increase Swap Space (for small instances)
```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Enable Docker Logging Limits
```bash
# Edit docker daemon config
sudo nano /etc/docker/daemon.json

# Add:
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}

# Restart Docker
sudo systemctl restart docker
```

### 3. Monitor Resources
```bash
# Install htop
sudo apt install htop -y

# Monitor
htop
```

---

## 🆘 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.simple.yml logs

# Check if ports are in use
sudo netstat -tulpn | grep LISTEN

# Restart Docker
sudo systemctl restart docker
```

### Out of Memory
```bash
# Check memory
free -h

# Add swap space (see Performance Optimization above)

# Or upgrade to larger instance (t3.small → t3.medium)
```

### Can't Connect from Browser
```bash
# Check security group allows ports 80, 8000, 8080, 8081
# Check services are running
docker-compose -f docker-compose.prod.simple.yml ps

# Check firewall
sudo ufw status
```

### Database Connection Issues
```bash
# Check database is running
docker exec storemybottle_db mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1"

# Check backend can connect
docker exec storemybottle_backend python -c "from database import engine; print(engine)"
```

---

## 📈 Scaling Options

### Vertical Scaling (Upgrade Instance)
1. Stop instance in AWS Console
2. Change instance type (t3.small → t3.medium)
3. Start instance
4. Services will auto-start

### Add Domain Name
1. Purchase domain (Route 53, Namecheap, etc.)
2. Point A record to EC2 IP
3. Update `.env` with domain name
4. Restart services

### Add CDN (CloudFlare)
1. Add domain to CloudFlare
2. Point DNS to CloudFlare nameservers
3. Enable CDN and caching
4. Free SSL included

---

## 💰 Cost Optimization

### Use Spot Instances (50-70% cheaper)
- Good for development/testing
- Can be interrupted by AWS
- Not recommended for production

### Stop Instance When Not in Use
```bash
# From AWS Console or CLI
aws ec2 stop-instances --instance-ids i-1234567890abcdef0

# You only pay for storage when stopped (~$2/month for 20GB)
```

### Use Reserved Instances (30-60% cheaper)
- Commit to 1 or 3 years
- Good for production workloads
- Significant savings

---

## 🎯 Next Steps

1. **Add Custom Domain**: Point your domain to EC2 IP
2. **Enable HTTPS**: Use Cloudflare or Let's Encrypt
3. **Set Up Monitoring**: CloudWatch or external service
4. **Configure Backups**: Automated database backups
5. **Add CI/CD**: Auto-deploy on git push (see CICD_SETUP_GUIDE.md)

---

## 📚 Useful Commands

```bash
# Start services
docker-compose -f docker-compose.prod.simple.yml up -d

# Stop services
docker-compose -f docker-compose.prod.simple.yml down

# View logs
docker-compose -f docker-compose.prod.simple.yml logs -f

# Restart service
docker-compose -f docker-compose.prod.simple.yml restart backend

# Rebuild service
docker-compose -f docker-compose.prod.simple.yml up -d --build backend

# Execute command in container
docker exec -it storemybottle_backend bash

# Database backup
docker exec storemybottle_db mysqldump -u root -p storemybottle > backup.sql

# Database restore
docker exec -i storemybottle_db mysql -u root -p storemybottle < backup.sql

# Clean up unused images
docker system prune -a
```

---

## ✅ Deployment Checklist

- [ ] EC2 instance launched
- [ ] Security group configured
- [ ] SSH access working
- [ ] Docker installed
- [ ] Repository cloned
- [ ] Environment variables configured
- [ ] Services started
- [ ] Database initialized
- [ ] Admin user created
- [ ] All frontends accessible
- [ ] API responding
- [ ] Backups configured
- [ ] Monitoring set up

---

**Your app is live! Access it at:**
- Customer: `http://YOUR_EC2_IP`
- Bartender: `http://YOUR_EC2_IP:8080`
- Admin: `http://YOUR_EC2_IP:8081`
- API: `http://YOUR_EC2_IP:8000`

**Total Cost: ~$15-30/month** 🎉

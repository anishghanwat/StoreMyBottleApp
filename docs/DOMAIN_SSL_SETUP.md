# Domain & SSL Setup Guide
## Domain: storemybottle.in

## Overview
We'll set up:
- `storemybottle.in` → Customer app
- `bartender.storemybottle.in` → Bartender app  
- `admin.storemybottle.in` → Admin portal
- `api.storemybottle.in` → Backend API

All with free SSL certificates from Let's Encrypt.

---

## Step 1: Configure DNS Records

Go to your domain registrar (where you bought storemybottle.in) and add these DNS records:

### A Records (point to your Elastic IP: 15.206.107.55)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | 15.206.107.55 | 3600 |
| A | www | 15.206.107.55 | 3600 |
| A | api | 15.206.107.55 | 3600 |
| A | bartender | 15.206.107.55 | 3600 |
| A | admin | 15.206.107.55 | 3600 |

**What this does:**
- `storemybottle.in` → Your EC2
- `www.storemybottle.in` → Your EC2
- `api.storemybottle.in` → Your EC2
- `bartender.storemybottle.in` → Your EC2
- `admin.storemybottle.in` → Your EC2

**Wait 5-10 minutes** for DNS to propagate, then test:
```bash
# Test from your local machine
ping storemybottle.in
ping api.storemybottle.in
ping bartender.storemybottle.in
ping admin.storemybottle.in

# Should all show: 15.206.107.55
```

---

## Step 2: Install Nginx & Certbot on EC2

SSH into your EC2 and install the required packages:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@15.206.107.55

# Update package list
sudo apt update

# Install Nginx
sudo apt install -y nginx

# Install Certbot for Let's Encrypt SSL
sudo apt install -y certbot python3-certbot-nginx

# Check Nginx is running
sudo systemctl status nginx
```

---

## Step 3: Configure Nginx as Reverse Proxy

Create Nginx configuration files:

```bash
# Create config for main domain (customer app)
sudo nano /etc/nginx/sites-available/storemybottle.in
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name storemybottle.in www.storemybottle.in;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Create config for API
sudo nano /etc/nginx/sites-available/api.storemybottle.in
```

Paste this:

```nginx
server {
    listen 80;
    server_name api.storemybottle.in;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Create config for bartender
sudo nano /etc/nginx/sites-available/bartender.storemybottle.in
```

Paste this:

```nginx
server {
    listen 80;
    server_name bartender.storemybottle.in;

    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Create config for admin
sudo nano /etc/nginx/sites-available/admin.storemybottle.in
```

Paste this:

```nginx
server {
    listen 80;
    server_name admin.storemybottle.in;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Step 4: Enable Nginx Sites

```bash
# Enable all sites
sudo ln -s /etc/nginx/sites-available/storemybottle.in /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.storemybottle.in /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/bartender.storemybottle.in /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.storemybottle.in /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Test HTTP access (before SSL):**
- http://storemybottle.in
- http://api.storemybottle.in/docs
- http://bartender.storemybottle.in
- http://admin.storemybottle.in

---

## Step 5: Get SSL Certificates (Let's Encrypt)

```bash
# Get certificates for all domains at once
sudo certbot --nginx -d storemybottle.in -d www.storemybottle.in -d api.storemybottle.in -d bartender.storemybottle.in -d admin.storemybottle.in

# Follow the prompts:
# 1. Enter your email address
# 2. Agree to terms (Y)
# 3. Share email with EFF (optional, Y or N)
# 4. Certbot will automatically configure HTTPS redirects

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certbot will automatically:**
- Get SSL certificates for all domains
- Configure Nginx to use HTTPS
- Set up HTTP → HTTPS redirects
- Configure auto-renewal (certificates renew every 90 days)

---

## Step 6: Update Security Group

Make sure your EC2 security group allows HTTPS:

1. Go to AWS Console → EC2 → Security Groups
2. Find your instance's security group
3. Add inbound rule:
   - Type: HTTPS
   - Protocol: TCP
   - Port: 443
   - Source: 0.0.0.0/0

---

## Step 7: Update Application Configuration

Now update your apps to use the new domain:

```bash
# Navigate to app directory
cd ~/StoreMyBottleApp

# Edit .env file
nano .env
```

Update these values:

```bash
# API URL (for backend)
API_URL=https://api.storemybottle.in

# Frontend API URL (for Vite apps)
VITE_API_URL=https://api.storemybottle.in

# CORS Origins
CORS_ORIGINS=https://storemybottle.in,https://www.storemybottle.in,https://bartender.storemybottle.in,https://admin.storemybottle.in,http://localhost:5173,http://localhost:5174,http://localhost:3000

# Frontend URL
FRONTEND_URL=https://storemybottle.in

# Environment (change to production for HTTPS)
ENVIRONMENT=production
```

```bash
# Save and exit (Ctrl+X, Y, Enter)

# Rebuild frontend containers with new domain
docker-compose -f docker-compose.prod.simple.yml down
docker rmi storemybottle_frontend storemybottle_bartender storemybottle_admin
docker-compose -f docker-compose.prod.simple.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.simple.yml logs -f
```

---

## Step 8: Test Everything

After rebuild (5-10 minutes), test all your apps:

### Customer App
- URL: https://storemybottle.in
- Should show lock icon (SSL)
- Should redirect from HTTP to HTTPS

### Bartender App
- URL: https://bartender.storemybottle.in
- QR scanner should now work (HTTPS required for camera)
- Should show lock icon

### Admin Portal
- URL: https://admin.storemybottle.in
- Login: admin@storemybottle.com / admin123
- Should show lock icon

### Backend API
- URL: https://api.storemybottle.in/docs
- Swagger docs should load
- Should show lock icon

---

## Step 9: Update Ngrok (Optional)

You can now stop ngrok since you have proper HTTPS:

```bash
# Find ngrok process
ps aux | grep ngrok

# Kill it
kill <process_id>
```

---

## Troubleshooting

### DNS not resolving
- Wait 10-15 minutes for DNS propagation
- Check with: `nslookup storemybottle.in`
- Clear your browser cache

### Certbot fails
- Make sure DNS is pointing to your EC2 (ping the domain)
- Check port 80 is open in security group
- Make sure Nginx is running: `sudo systemctl status nginx`

### 502 Bad Gateway
- Check Docker containers are running: `docker-compose ps`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Restart Nginx: `sudo systemctl restart nginx`

### Mixed content errors
- Make sure all apps are rebuilt with HTTPS URLs
- Check browser console for HTTP requests
- Verify CORS_ORIGINS includes all HTTPS domains

---

## Summary

✅ DNS configured (5 subdomains)  
✅ Nginx reverse proxy installed  
✅ SSL certificates from Let's Encrypt  
✅ Auto-renewal configured  
✅ Apps rebuilt with HTTPS URLs  
✅ QR scanner will work (HTTPS + camera access)  

**Your new URLs:**
- Customer: https://storemybottle.in
- Bartender: https://bartender.storemybottle.in
- Admin: https://admin.storemybottle.in
- API: https://api.storemybottle.in

**Next steps:**
- Test all apps with HTTPS
- Implement PWA features
- Set up monitoring

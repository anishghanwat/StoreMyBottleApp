#!/bin/bash
# Nginx & SSL Setup Script for storemybottle.in
# Run this on your EC2 instance after DNS is configured

set -e

echo "=========================================="
echo "StoreMyBottle - Nginx & SSL Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run with sudo: sudo bash setup-nginx-ssl.sh"
    exit 1
fi

# Install Nginx and Certbot
echo "Step 1: Installing Nginx and Certbot..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create Nginx config for main domain (customer app)
echo "Step 2: Creating Nginx configurations..."
cat > /etc/nginx/sites-available/storemybottle.in <<'EOF'
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
EOF

# Create Nginx config for API
cat > /etc/nginx/sites-available/api.storemybottle.in <<'EOF'
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
EOF

# Create Nginx config for bartender
cat > /etc/nginx/sites-available/bartender.storemybottle.in <<'EOF'
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
EOF

# Create Nginx config for admin
cat > /etc/nginx/sites-available/admin.storemybottle.in <<'EOF'
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
EOF

# Enable sites
echo "Step 3: Enabling sites..."
ln -sf /etc/nginx/sites-available/storemybottle.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/api.storemybottle.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/bartender.storemybottle.in /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/admin.storemybottle.in /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
echo "Step 4: Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "Step 5: Reloading Nginx..."
systemctl reload nginx

echo ""
echo "=========================================="
echo "Nginx setup complete!"
echo "=========================================="
echo ""
echo "Test HTTP access (before SSL):"
echo "  - http://storemybottle.in"
echo "  - http://api.storemybottle.in/docs"
echo "  - http://bartender.storemybottle.in"
echo "  - http://admin.storemybottle.in"
echo ""
echo "Next step: Get SSL certificates"
echo "Run this command:"
echo ""
echo "sudo certbot --nginx -d storemybottle.in -d www.storemybottle.in -d api.storemybottle.in -d bartender.storemybottle.in -d admin.storemybottle.in"
echo ""
echo "=========================================="

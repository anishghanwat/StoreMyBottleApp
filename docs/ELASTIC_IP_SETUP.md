# Elastic IP Setup Guide for EC2

## What is an Elastic IP?
An Elastic IP is a static IPv4 address that stays with your AWS account. Unlike the default public IP that changes when you stop/start your EC2 instance, an Elastic IP remains constant.

## Benefits
- Permanent IP address (won't change on restart)
- Free when attached to a running instance
- Can be reassigned to different instances
- Better for DNS and domain setup

## Cost
- **FREE** when attached to a running EC2 instance
- **$0.005/hour (~$3.60/month)** if allocated but NOT attached to a running instance
- So keep it attached to avoid charges!

---

## Step-by-Step Setup

### Step 1: Allocate an Elastic IP

1. Go to AWS Console: https://console.aws.amazon.com/ec2/
2. In the left sidebar, scroll down to **Network & Security**
3. Click **Elastic IPs**
4. Click **Allocate Elastic IP address** (orange button, top right)
5. Leave settings as default:
   - Network Border Group: (your region, e.g., ap-south-1)
   - Public IPv4 address pool: Amazon's pool of IPv4 addresses
6. Click **Allocate**
7. You'll see a success message with your new Elastic IP (e.g., 13.235.XXX.XXX)

### Step 2: Associate Elastic IP with Your EC2 Instance

1. On the Elastic IPs page, select your newly allocated IP (checkbox)
2. Click **Actions** dropdown (top right)
3. Click **Associate Elastic IP address**
4. Configure:
   - **Resource type**: Instance
   - **Instance**: Select your EC2 instance (should show your instance ID)
   - **Private IP address**: Leave as default (auto-selected)
   - **Reassociation**: Check "Allow this Elastic IP address to be reassociated" (optional, but recommended)
5. Click **Associate**
6. Success! Your Elastic IP is now attached to your EC2 instance

### Step 3: Update Your Configuration

Your EC2 instance now has a new public IP. You need to update:

#### A. Update Security Group (if needed)
Your security group rules should already work since they're based on ports, not IPs. But verify:
1. Go to **EC2 Dashboard** > **Security Groups**
2. Find your instance's security group
3. Verify these inbound rules exist:
   - Port 22 (SSH): Your IP or 0.0.0.0/0
   - Port 80 (HTTP): 0.0.0.0/0
   - Port 443 (HTTPS): 0.0.0.0/0
   - Port 3000 (Admin): 0.0.0.0/0
   - Port 5173 (Customer): 0.0.0.0/0
   - Port 5174 (Bartender): 0.0.0.0/0
   - Port 8000 (Backend): 0.0.0.0/0

#### B. Update SSH Connection
```bash
# Old connection (will no longer work):
ssh -i your-key.pem ubuntu@13.233.223.186

# New connection (use your new Elastic IP):
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP
```

#### C. Update .env File on EC2
```bash
# SSH into your instance with the new IP
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Navigate to your app directory
cd ~/StoreMyBottleApp

# Edit the .env file
nano .env

# Update these lines with your new Elastic IP:
API_URL=http://YOUR_ELASTIC_IP:8000
VITE_API_URL=http://YOUR_ELASTIC_IP:8000
CORS_ORIGINS=http://YOUR_ELASTIC_IP:5173,http://YOUR_ELASTIC_IP:5174,http://YOUR_ELASTIC_IP:3000,http://localhost:5173,http://localhost:5174,http://localhost:3000
FRONTEND_URL=http://YOUR_ELASTIC_IP:5173

# Save and exit (Ctrl+X, then Y, then Enter)
```

#### D. Rebuild Docker Containers
```bash
# Stop all containers
docker-compose -f docker-compose.prod.simple.yml down

# Remove old images to force rebuild
docker rmi storemybottle_frontend storemybottle_bartender storemybottle_admin

# Rebuild with new IP
docker-compose -f docker-compose.prod.simple.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.simple.yml logs -f
```

### Step 4: Test Your Applications

Access your apps with the new Elastic IP:
- Customer App: `http://YOUR_ELASTIC_IP:5173`
- Bartender App: `http://YOUR_ELASTIC_IP:5174`
- Admin Portal: `http://YOUR_ELASTIC_IP:3000`
- Backend API: `http://YOUR_ELASTIC_IP:8000/docs`

---

## Important Notes

### Elastic IP Charges
- **No charge** when attached to a running instance
- **Charged** if you allocate but don't attach it
- **Charged** if attached to a stopped instance
- Always release unused Elastic IPs to avoid charges

### Releasing an Elastic IP
If you no longer need it:
1. First, **disassociate** it from your instance
2. Then, **release** it back to AWS
3. This prevents ongoing charges

### Multiple Elastic IPs
- You can have up to 5 Elastic IPs per region (default limit)
- Can request more from AWS Support if needed
- Each one is free when attached to a running instance

---

## Quick Reference Commands

```bash
# SSH with new Elastic IP
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# Check current public IP from inside EC2
curl ifconfig.me

# Update and rebuild
cd ~/StoreMyBottleApp
nano .env  # Update IPs
docker-compose -f docker-compose.prod.simple.yml down
docker rmi storemybottle_frontend storemybottle_bartender storemybottle_admin
docker-compose -f docker-compose.prod.simple.yml up -d --build
```

---

## Next Steps After Elastic IP

1. **Domain Setup**: Point your domain's A record to this Elastic IP
2. **SSL Certificate**: Set up Let's Encrypt SSL for HTTPS
3. **Nginx Reverse Proxy**: Use nginx to handle all traffic on ports 80/443
4. **Update ngrok**: If using ngrok, update it to use the new IP

---

## Troubleshooting

### Can't SSH after Elastic IP change
- Make sure you're using the new Elastic IP address
- Check your security group allows SSH (port 22) from your IP

### Apps not accessible
- Verify Elastic IP is associated with your instance
- Check security group has all required ports open
- Ensure Docker containers are running: `docker-compose ps`

### Old IP still showing
- The old IP is released and no longer works
- Update all bookmarks and saved links to use new Elastic IP
- Clear browser cache if needed

---

## Summary

✅ Elastic IP gives you a permanent IP address  
✅ Free when attached to running instance  
✅ Survives instance stop/start  
✅ Perfect for domain setup  
✅ Required before setting up SSL certificates  

Your current IP: `13.233.223.186`  
Your new Elastic IP: `(to be allocated)`

# GitHub Actions CI/CD Setup

## 🚀 Automated Deployment to EC2

Set up continuous deployment so every push to `main` automatically deploys to your EC2 instance.

---

## 📋 What You Get

- ✅ Automatic deployment on every push to `main`
- ✅ Run tests before deployment
- ✅ Build verification for all frontends
- ✅ Security scanning
- ✅ Deployment verification
- ✅ Free for public repositories
- ✅ Manual deployment trigger option

---

## 🎯 Workflow Overview

```
Push to main
    ↓
Run Tests (Backend + Frontend builds)
    ↓
Deploy to EC2 (SSH + Docker Compose)
    ↓
Verify Deployment (Health check)
    ↓
✅ Done!
```

---

## 📁 Files Created

1. `.github/workflows/deploy.yml` - Main deployment workflow
2. `.github/workflows/test.yml` - Testing workflow for PRs

---

## 🔧 Setup Instructions

### Step 1: Prepare Your EC2 Instance (5 minutes)

Make sure your EC2 instance is set up and the app is running (follow EC2_SIMPLE_DEPLOYMENT.md first).

### Step 2: Get Your SSH Key (2 minutes)

You need the private key you downloaded when creating the EC2 instance.

**On Windows**:
```powershell
# View your key
Get-Content storemybottle-key.pem
```

**On Mac/Linux**:
```bash
# View your key
cat storemybottle-key.pem
```

Copy the entire content including:
```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

### Step 3: Add GitHub Secrets (5 minutes)

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these 3 secrets:

#### Secret 1: EC2_HOST
- **Name**: `EC2_HOST`
- **Value**: Your EC2 public IP (e.g., `54.123.45.67`)

#### Secret 2: EC2_USERNAME
- **Name**: `EC2_USERNAME`
- **Value**: `ubuntu` (default for Ubuntu AMI)

#### Secret 3: EC2_SSH_KEY
- **Name**: `EC2_SSH_KEY`
- **Value**: Paste your entire private key content

---

## 🧪 Test the Setup

### Option 1: Push to Main
```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "test: Trigger deployment"
git push origin main
```

### Option 2: Manual Trigger
1. Go to **Actions** tab in GitHub
2. Click **Deploy to EC2** workflow
3. Click **Run workflow**
4. Select `main` branch
5. Click **Run workflow**

---

## 📊 Monitor Deployment

### View Workflow Progress
1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch real-time logs

### Check Deployment Status
```bash
# SSH into EC2
ssh -i storemybottle-key.pem ubuntu@YOUR_EC2_IP

# Check services
cd ~/StoreMyBottleApp
docker-compose -f docker-compose.prod.simple.yml ps

# View logs
docker-compose -f docker-compose.prod.simple.yml logs -f
```

---

## 🔄 Workflow Details

### Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers**:
- Push to `main` branch
- Manual trigger from Actions tab

**Steps**:
1. **Test Job**:
   - Checkout code
   - Set up Python
   - Install dependencies
   - Run backend tests

2. **Deploy Job**:
   - SSH into EC2
   - Pull latest code
   - Stop services
   - Rebuild and restart
   - Clean up old images

3. **Verify Job**:
   - Check backend health endpoint
   - Confirm deployment success

### Test Workflow (`.github/workflows/test.yml`)

**Triggers**:
- Pull requests to `main`
- Push to `develop` branch

**Steps**:
1. **Backend Tests**:
   - Set up MySQL service
   - Run all backend tests
   - Report results

2. **Frontend Build**:
   - Build customer app
   - Build bartender app
   - Build admin panel

3. **Security Scan**:
   - Scan for vulnerabilities
   - Report critical/high issues

---

## 🎨 Customization

### Change Deployment Branch

Edit `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches:
      - production  # Change from 'main' to 'production'
```

### Add Slack Notifications

Add to `.github/workflows/deploy.yml`:
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Email Notifications

GitHub automatically sends emails on workflow failures to repository admins.

### Deploy to Multiple Servers

Add more secrets (EC2_HOST_STAGING, EC2_HOST_PROD) and create separate jobs:
```yaml
deploy-staging:
  # Deploy to staging server
  
deploy-production:
  needs: deploy-staging
  # Deploy to production server
```

---

## 🔒 Security Best Practices

### 1. Use Deploy Keys (Recommended)

Instead of using your personal SSH key:

```bash
# On EC2, generate a deploy key
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy

# Add public key to authorized_keys
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys

# Use private key as EC2_SSH_KEY secret
cat ~/.ssh/github_deploy
```

### 2. Restrict SSH Key Permissions

On EC2:
```bash
# Create a deploy user with limited permissions
sudo adduser deploy
sudo usermod -aG docker deploy

# Use deploy user in GitHub Actions
# EC2_USERNAME: deploy
```

### 3. Use Environment-Specific Secrets

For production:
```yaml
environment:
  name: production
  url: http://your-domain.com
```

Then add secrets under **Settings** → **Environments** → **production**

---

## 🐛 Troubleshooting

### Deployment Fails: "Permission denied"

**Problem**: SSH key not accepted

**Solution**:
1. Check EC2_SSH_KEY secret includes full key with headers
2. Verify EC2_USERNAME is correct (usually `ubuntu`)
3. Check EC2 security group allows SSH from GitHub IPs

### Deployment Fails: "Connection refused"

**Problem**: Can't connect to EC2

**Solution**:
1. Verify EC2_HOST is correct public IP
2. Check EC2 instance is running
3. Verify security group allows SSH (port 22)

### Services Don't Start After Deployment

**Problem**: Docker Compose fails

**Solution**:
```bash
# SSH into EC2
ssh -i storemybottle-key.pem ubuntu@YOUR_EC2_IP

# Check logs
cd ~/StoreMyBottleApp
docker-compose -f docker-compose.prod.simple.yml logs

# Manually restart
docker-compose -f docker-compose.prod.simple.yml up -d --build
```

### Tests Fail But Want to Deploy Anyway

Edit `.github/workflows/deploy.yml`:
```yaml
- name: Run backend tests
  run: |
    cd backend
    python -m pytest test_*.py -v
  continue-on-error: true  # Add this line
```

---

## 📈 Advanced Features

### 1. Blue-Green Deployment

```yaml
- name: Blue-Green Deploy
  run: |
    # Start new containers with different names
    docker-compose -f docker-compose.prod.simple.yml up -d --scale backend=2
    
    # Wait for health check
    sleep 30
    
    # Switch traffic
    # Stop old containers
```

### 2. Rollback on Failure

```yaml
- name: Deploy
  id: deploy
  run: |
    # Deployment commands
    
- name: Rollback on failure
  if: failure()
  run: |
    cd ~/StoreMyBottleApp
    git reset --hard HEAD~1
    docker-compose -f docker-compose.prod.simple.yml up -d --build
```

### 3. Database Migrations

```yaml
- name: Run migrations
  run: |
    docker exec storemybottle_backend python migrate.py
```

### 4. Backup Before Deploy

```yaml
- name: Backup database
  run: |
    docker exec storemybottle_db mysqldump -u root -p$MYSQL_ROOT_PASSWORD storemybottle > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📊 Monitoring Deployments

### GitHub Actions Dashboard

View all deployments:
1. Go to **Actions** tab
2. See history of all deployments
3. Click any deployment to see logs

### Deployment Badges

Add to your README.md:
```markdown
![Deploy Status](https://github.com/anishghanwat/StoreMyBottleApp/actions/workflows/deploy.yml/badge.svg)
```

### Deployment Notifications

Set up notifications in GitHub:
1. **Settings** → **Notifications**
2. Enable **Actions** notifications
3. Choose email or mobile

---

## 💡 Tips & Tricks

### 1. Speed Up Deployments

Use Docker layer caching:
```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3

- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
```

### 2. Deploy Only Changed Services

```bash
# In deploy script
if git diff --name-only HEAD~1 | grep "^backend/"; then
  docker-compose -f docker-compose.prod.simple.yml up -d --build backend
fi
```

### 3. Scheduled Deployments

Deploy at specific times:
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### 4. Deploy on Tag

Deploy when you create a release:
```yaml
on:
  push:
    tags:
      - 'v*'
```

---

## ✅ Deployment Checklist

Before setting up GitHub Actions:
- [ ] EC2 instance running
- [ ] App deployed manually at least once
- [ ] SSH key available
- [ ] GitHub repository is public or has Actions enabled
- [ ] All secrets added to GitHub

After setup:
- [ ] Test deployment triggered successfully
- [ ] Services restarted on EC2
- [ ] Health check passed
- [ ] App accessible from browser
- [ ] Logs show no errors

---

## 🎯 Next Steps

1. **Set up staging environment**: Deploy to staging before production
2. **Add more tests**: Increase test coverage
3. **Set up monitoring**: Use CloudWatch or external service
4. **Add performance tests**: Load testing before deployment
5. **Implement feature flags**: Deploy without releasing

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SSH Action Documentation](https://github.com/appleboy/ssh-action)

---

## 🎉 You're Done!

Your CI/CD pipeline is now set up! Every push to `main` will automatically deploy to your EC2 instance.

**Test it now**:
```bash
# Make a change
echo "# Auto-deploy test" >> README.md

# Push to trigger deployment
git add README.md
git commit -m "test: Auto-deploy"
git push origin main

# Watch it deploy in GitHub Actions tab!
```

**Deployment time**: ~2-3 minutes per deployment 🚀

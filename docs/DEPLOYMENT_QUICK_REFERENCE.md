# Deployment Quick Reference

## 🚀 Three Ways to Deploy

### Option 1: Simple EC2 (Recommended for Start)
**Cost**: ~$15-30/month | **Time**: 30 minutes | **Complexity**: ⭐

```bash
# 1. Launch EC2 (t3.small)
# 2. Install Docker
curl -fsSL https://get.docker.com | sudo sh

# 3. Clone and deploy
git clone https://github.com/anishghanwat/StoreMyBottleApp.git
cd StoreMyBottleApp
cp .env.production .env
# Edit .env with your values
docker-compose -f docker-compose.prod.simple.yml --env-file .env up -d --build
```

**Access**:
- Customer: `http://YOUR_IP`
- Bartender: `http://YOUR_IP:8080`
- Admin: `http://YOUR_IP:8081`
- API: `http://YOUR_IP:8000`

**Guide**: `docs/EC2_SIMPLE_DEPLOYMENT.md`

---

### Option 2: EC2 + GitHub Actions (Recommended)
**Cost**: ~$15-30/month | **Time**: 45 minutes | **Complexity**: ⭐⭐

Same as Option 1, plus:

```bash
# 4. Add GitHub Secrets
# - EC2_HOST: Your EC2 IP
# - EC2_USERNAME: ubuntu
# - EC2_SSH_KEY: Your private key

# 5. Push to deploy
git push origin main
# Automatically deploys!
```

**Guide**: `docs/GITHUB_ACTIONS_SETUP.md`

---

### Option 3: Full AWS (Production Scale)
**Cost**: ~$150-400/month | **Time**: 1 week | **Complexity**: ⭐⭐⭐⭐⭐

- ECS Fargate (auto-scaling)
- RDS MySQL (Multi-AZ)
- CloudFront CDN
- Application Load Balancer
- CodePipeline CI/CD

**Guide**: `docs/AWS_DEPLOYMENT_PLAN.md`

---

## 📊 Comparison Table

| Feature | EC2 Simple | EC2 + Actions | Full AWS |
|---------|-----------|---------------|----------|
| **Cost/month** | $15-30 | $15-30 | $150-400 |
| **Setup Time** | 30 min | 45 min | 1 week |
| **Auto-deploy** | ❌ | ✅ | ✅ |
| **Auto-scaling** | ❌ | ❌ | ✅ |
| **High Availability** | ❌ | ❌ | ✅ |
| **CDN** | ❌ | ❌ | ✅ |
| **Load Balancer** | ❌ | ❌ | ✅ |
| **Managed DB** | ❌ | ❌ | ✅ |
| **Zero Downtime** | ❌ | ❌ | ✅ |
| **Best For** | Testing | Small Prod | Enterprise |

---

## 🎯 Recommended Path

### For Testing/MVP
1. Start with **EC2 Simple** (30 min)
2. Add **GitHub Actions** when ready (15 min)
3. Scale to **Full AWS** when traffic grows

### For Production
1. Start with **EC2 + GitHub Actions** (45 min)
2. Monitor traffic and costs
3. Migrate to **Full AWS** when needed

---

## 🔧 Quick Commands

### EC2 Management
```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_IP

# View logs
docker-compose -f docker-compose.prod.simple.yml logs -f

# Restart services
docker-compose -f docker-compose.prod.simple.yml restart

# Update app
git pull origin main
docker-compose -f docker-compose.prod.simple.yml up -d --build

# Backup database
docker exec storemybottle_db mysqldump -u root -p storemybottle > backup.sql
```

### GitHub Actions
```bash
# Trigger deployment
git push origin main

# View status
# Go to GitHub → Actions tab

# Manual trigger
# GitHub → Actions → Deploy to EC2 → Run workflow
```

---

## 🆘 Troubleshooting

### Can't access app
```bash
# Check services running
docker-compose -f docker-compose.prod.simple.yml ps

# Check security group allows ports 80, 8000, 8080, 8081
# Check EC2 instance is running
```

### Deployment failed
```bash
# View logs
docker-compose -f docker-compose.prod.simple.yml logs

# Restart services
docker-compose -f docker-compose.prod.simple.yml restart

# Rebuild from scratch
docker-compose -f docker-compose.prod.simple.yml down
docker-compose -f docker-compose.prod.simple.yml up -d --build
```

### Out of memory
```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Or upgrade instance (t3.small → t3.medium)
```

---

## 📚 Documentation Index

- **EC2 Simple**: `docs/EC2_SIMPLE_DEPLOYMENT.md`
- **GitHub Actions**: `docs/GITHUB_ACTIONS_SETUP.md`
- **Full AWS**: `docs/AWS_DEPLOYMENT_PLAN.md`
- **CI/CD (CodePipeline)**: `docs/CICD_SETUP_GUIDE.md`
- **Quick Start**: `docs/AWS_QUICK_START.md`
- **Summary**: `docs/DEPLOYMENT_SUMMARY.md`

---

## ✅ Pre-Deployment Checklist

- [ ] AWS account created
- [ ] Domain purchased (optional)
- [ ] GitHub repository set up
- [ ] Environment variables configured
- [ ] SSH key downloaded
- [ ] Security groups configured
- [ ] Budget set in AWS

---

## 🎉 Quick Start

**Want to deploy right now?**

1. Follow `docs/EC2_SIMPLE_DEPLOYMENT.md`
2. Get live in 30 minutes
3. Add GitHub Actions later

**Questions?**
- Check the troubleshooting sections
- Review the full documentation
- Test locally with `docker-compose.yml` first

---

**Choose your deployment path and get started! 🚀**

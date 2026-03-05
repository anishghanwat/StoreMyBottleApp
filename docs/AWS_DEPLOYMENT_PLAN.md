# AWS Deployment Plan - StoreMyBottle

## Overview

Complete AWS deployment architecture with CI/CD pipeline for production-ready deployment.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CloudFront (CDN)                      │
│                    SSL/TLS Termination                       │
└─────────────────┬───────────────────────┬───────────────────┘
                  │                       │
        ┌─────────▼─────────┐   ┌────────▼──────────┐
        │   S3 Bucket       │   │  Application      │
        │   (Frontend)      │   │  Load Balancer    │
        │   - Customer      │   │  (ALB)            │
        │   - Bartender     │   └────────┬──────────┘
        │   - Admin         │            │
        └───────────────────┘   ┌────────▼──────────┐
                                │   ECS Fargate     │
                                │   (Backend API)   │
                                │   Auto-scaling    │
                                └────────┬──────────┘
                                         │
                                ┌────────▼──────────┐
                                │   RDS MySQL       │
                                │   Multi-AZ        │
                                │   Automated       │
                                │   Backups         │
                                └───────────────────┘
```

---

## 📋 AWS Services Required

### Core Services
1. **EC2 / ECS Fargate** - Backend API hosting
2. **RDS MySQL** - Database (Multi-AZ for high availability)
3. **S3** - Frontend static hosting
4. **CloudFront** - CDN for global distribution
5. **Route 53** - DNS management
6. **Certificate Manager (ACM)** - SSL/TLS certificates
7. **Application Load Balancer (ALB)** - Traffic distribution
8. **ECR** - Docker image registry

### CI/CD Services
9. **CodePipeline** - Orchestration
10. **CodeBuild** - Build automation
11. **CodeDeploy** - Deployment automation

### Security & Monitoring
12. **Secrets Manager** - Secure credential storage
13. **CloudWatch** - Logging and monitoring
14. **WAF** - Web Application Firewall
15. **IAM** - Access management

### Optional (Recommended)
16. **ElastiCache (Redis)** - Session caching
17. **SES** - Email service (password reset)
18. **SNS** - Notifications and alerts

---

## 💰 Cost Estimation (Monthly)

### Minimal Setup (~$50-80/month)
- **RDS MySQL (db.t3.micro)**: $15-20
- **ECS Fargate (0.25 vCPU, 0.5GB)**: $15-20
- **S3 + CloudFront**: $5-10
- **ALB**: $16
- **Route 53**: $0.50
- **Data Transfer**: $5-10

### Recommended Setup (~$150-200/month)
- **RDS MySQL (db.t3.small, Multi-AZ)**: $60-80
- **ECS Fargate (0.5 vCPU, 1GB, 2 tasks)**: $40-50
- **S3 + CloudFront**: $10-15
- **ALB**: $16
- **ElastiCache (cache.t3.micro)**: $15
- **Route 53**: $0.50
- **WAF**: $10
- **Data Transfer**: $10-20

### Production Setup (~$300-400/month)
- **RDS MySQL (db.t3.medium, Multi-AZ)**: $120-150
- **ECS Fargate (1 vCPU, 2GB, 3+ tasks)**: $80-100
- **S3 + CloudFront**: $20-30
- **ALB**: $16
- **ElastiCache (cache.t3.small)**: $30
- **Route 53**: $0.50
- **WAF**: $10
- **Monitoring & Logs**: $20-30
- **Data Transfer**: $30-50

---

## 🚀 Deployment Strategy

### Phase 1: Infrastructure Setup (Day 1-2)
1. Set up AWS account and IAM users
2. Configure VPC and networking
3. Create RDS MySQL database
4. Set up S3 buckets for frontend
5. Configure CloudFront distributions
6. Set up SSL certificates (ACM)
7. Configure Route 53 DNS

### Phase 2: Backend Deployment (Day 2-3)
1. Create ECR repository
2. Build and push Docker image
3. Set up ECS cluster and task definitions
4. Configure Application Load Balancer
5. Set up auto-scaling policies
6. Configure environment variables in Secrets Manager
7. Test backend API

### Phase 3: Frontend Deployment (Day 3-4)
1. Build production frontends
2. Upload to S3 buckets
3. Configure CloudFront distributions
4. Set up custom domains
5. Test all three frontends

### Phase 4: CI/CD Pipeline (Day 4-5)
1. Set up CodePipeline
2. Configure CodeBuild for backend
3. Configure CodeBuild for frontends
4. Set up automated testing
5. Configure deployment stages
6. Test full pipeline

### Phase 5: Monitoring & Security (Day 5-6)
1. Set up CloudWatch dashboards
2. Configure alarms and notifications
3. Enable WAF rules
4. Set up backup policies
5. Configure log retention
6. Security audit

### Phase 6: Testing & Go-Live (Day 6-7)
1. End-to-end testing
2. Load testing
3. Security testing
4. DNS cutover
5. Monitor and optimize

---

## 📁 Required Files for Deployment

### 1. Backend Dockerfile
```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### 2. ECS Task Definition
```json
{
  "family": "storemybottle-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<ECR_IMAGE_URI>",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/storemybottle-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 3. BuildSpec for Backend
```yaml
# buildspec-backend.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/storemybottle-backend
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - cd backend
      - docker build -t $REPOSITORY_URI:latest -f Dockerfile.prod .
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"backend","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
```

### 4. BuildSpec for Frontend
```yaml
# buildspec-frontend.yml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Installing dependencies...
      - cd frontend
      - npm ci
  build:
    commands:
      - echo Build started on `date`
      - echo Building production bundle...
      - npm run build
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Syncing to S3...
      - aws s3 sync dist/ s3://$S3_BUCKET_CUSTOMER --delete
      - echo Invalidating CloudFront cache...
      - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DIST_ID --paths "/*"

artifacts:
  files:
    - '**/*'
  base-directory: frontend/dist
```

---

## 🔐 Environment Variables & Secrets

### Secrets Manager Configuration

**Database Credentials**:
```json
{
  "username": "admin",
  "password": "<STRONG_PASSWORD>",
  "engine": "mysql",
  "host": "<RDS_ENDPOINT>",
  "port": 3306,
  "dbname": "storemybottle"
}
```

**Application Secrets**:
```json
{
  "JWT_SECRET": "<64_CHAR_SECRET>",
  "JWT_REFRESH_SECRET": "<64_CHAR_SECRET>",
  "CORS_ORIGINS": "https://app.storemybottle.com,https://bartender.storemybottle.com,https://admin.storemybottle.com"
}
```

### Environment Variables for ECS
```bash
ENVIRONMENT=production
DATABASE_URL=mysql+pymysql://user:pass@host:3306/db
JWT_SECRET=<from_secrets_manager>
JWT_REFRESH_SECRET=<from_secrets_manager>
CORS_ORIGINS=<from_secrets_manager>
REDIS_URL=redis://elasticache-endpoint:6379
LOG_LEVEL=INFO
```

---

## 🌐 Domain Configuration

### DNS Records (Route 53)

```
# Customer App
app.storemybottle.com → CloudFront Distribution

# Bartender App
bartender.storemybottle.com → CloudFront Distribution

# Admin Panel
admin.storemybottle.com → CloudFront Distribution

# API
api.storemybottle.com → Application Load Balancer
```

### SSL Certificates (ACM)

Request certificates for:
1. `*.storemybottle.com` (wildcard)
2. `storemybottle.com` (root domain)

---

## 📊 Monitoring & Alerts

### CloudWatch Dashboards

**Backend Metrics**:
- CPU utilization
- Memory utilization
- Request count
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database connections

**Frontend Metrics**:
- CloudFront requests
- Cache hit ratio
- Error rate
- Data transfer

### CloudWatch Alarms

```yaml
Alarms:
  - Name: HighCPUUtilization
    Metric: CPUUtilization
    Threshold: 80%
    Action: SNS notification + Auto-scale

  - Name: HighErrorRate
    Metric: 5XXError
    Threshold: 5%
    Action: SNS notification

  - Name: DatabaseConnections
    Metric: DatabaseConnections
    Threshold: 80% of max
    Action: SNS notification

  - Name: HighLatency
    Metric: TargetResponseTime
    Threshold: 2 seconds
    Action: SNS notification
```

---

## 🔒 Security Checklist

### Network Security
- [ ] VPC with public and private subnets
- [ ] Security groups configured (least privilege)
- [ ] RDS in private subnet only
- [ ] NAT Gateway for outbound traffic
- [ ] Network ACLs configured

### Application Security
- [ ] WAF rules enabled
- [ ] Rate limiting configured
- [ ] HTTPS only (redirect HTTP to HTTPS)
- [ ] Security headers configured
- [ ] Secrets in Secrets Manager (not environment variables)

### Database Security
- [ ] Encryption at rest enabled
- [ ] Encryption in transit (SSL)
- [ ] Automated backups enabled
- [ ] Multi-AZ deployment
- [ ] Parameter group hardened

### Access Control
- [ ] IAM roles with least privilege
- [ ] MFA enabled for root account
- [ ] CloudTrail logging enabled
- [ ] VPC Flow Logs enabled
- [ ] S3 bucket policies configured

---

## 🧪 Testing Strategy

### Pre-Deployment Testing
1. **Unit Tests**: Run all backend tests
2. **Integration Tests**: Test API endpoints
3. **Security Tests**: Run security scans
4. **Load Tests**: Simulate traffic

### Post-Deployment Testing
1. **Smoke Tests**: Verify all endpoints
2. **End-to-End Tests**: Full user flows
3. **Performance Tests**: Response times
4. **Security Tests**: Penetration testing

---

## 📈 Scaling Strategy

### Auto-Scaling Configuration

**ECS Service Auto-Scaling**:
```yaml
MinCapacity: 2
MaxCapacity: 10
TargetCPUUtilization: 70%
TargetMemoryUtilization: 80%
ScaleOutCooldown: 60 seconds
ScaleInCooldown: 300 seconds
```

**RDS Scaling**:
- Start with db.t3.small
- Monitor performance
- Upgrade to db.t3.medium if needed
- Consider Read Replicas for read-heavy workloads

---

## 🔄 Backup & Disaster Recovery

### RDS Backups
- **Automated Backups**: Daily, 7-day retention
- **Manual Snapshots**: Before major changes
- **Point-in-Time Recovery**: Enabled
- **Cross-Region Replication**: Optional (for DR)

### Application Backups
- **Docker Images**: Retained in ECR
- **Frontend Builds**: Versioned in S3
- **Configuration**: Version controlled in Git

### Recovery Time Objective (RTO)
- **Database**: < 1 hour (restore from snapshot)
- **Application**: < 15 minutes (redeploy from ECR)
- **Frontend**: < 5 minutes (CloudFront cache)

---

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] AWS account created and configured
- [ ] Domain purchased and verified
- [ ] SSL certificates requested and validated
- [ ] All secrets generated and stored
- [ ] Infrastructure code reviewed
- [ ] Backup strategy defined

### Deployment
- [ ] VPC and networking configured
- [ ] RDS database created and initialized
- [ ] ECR repository created
- [ ] Docker image built and pushed
- [ ] ECS cluster and service created
- [ ] ALB configured and tested
- [ ] S3 buckets created
- [ ] Frontend builds uploaded
- [ ] CloudFront distributions configured
- [ ] DNS records created
- [ ] CI/CD pipeline configured

### Post-Deployment
- [ ] All endpoints tested
- [ ] SSL certificates verified
- [ ] Monitoring dashboards created
- [ ] Alarms configured
- [ ] Backup jobs verified
- [ ] Security audit completed
- [ ] Load testing performed
- [ ] Documentation updated

---

## 🎯 Success Metrics

### Performance
- API response time < 200ms (p95)
- Frontend load time < 2 seconds
- 99.9% uptime

### Cost
- Stay within budget ($150-200/month initially)
- Optimize based on usage patterns

### Security
- Zero security incidents
- All security scans passing
- Regular security audits

---

## 📚 Next Steps

1. **Review this plan** and adjust based on your requirements
2. **Set up AWS account** if not already done
3. **Purchase domain** (storemybottle.com)
4. **Start with Phase 1** (Infrastructure Setup)
5. **Follow the deployment checklist**

---

## 🆘 Support & Resources

### AWS Documentation
- [ECS Fargate](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html)
- [RDS MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_MySQL.html)
- [CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [CodePipeline](https://docs.aws.amazon.com/codepipeline/)

### Useful Tools
- [AWS CLI](https://aws.amazon.com/cli/)
- [AWS CDK](https://aws.amazon.com/cdk/) (Infrastructure as Code)
- [Terraform](https://www.terraform.io/) (Alternative IaC)

---

**Ready to deploy? Let's start with Phase 1!**

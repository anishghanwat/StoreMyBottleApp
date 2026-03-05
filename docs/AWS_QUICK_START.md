# AWS Deployment - Quick Start Guide

## 🚀 Get Your App Live in 1 Day

This is a simplified, step-by-step guide to get StoreMyBottle deployed on AWS quickly.

---

## Prerequisites (15 minutes)

1. **AWS Account**: [Create one here](https://aws.amazon.com/)
2. **Domain Name**: Purchase from Route 53 or transfer existing domain
3. **AWS CLI**: [Install here](https://aws.amazon.com/cli/)
4. **GitHub Token**: [Create here](https://github.com/settings/tokens)

---

## Step 1: Initial AWS Setup (30 minutes)

### 1.1 Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### 1.2 Set Environment Variables
```bash
# Set these in your terminal
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
export DOMAIN_NAME=storemybottle.com
```

---

## Step 2: Database Setup (20 minutes)

### 2.1 Create RDS MySQL Database
```bash
# Create database (this takes 10-15 minutes)
aws rds create-db-instance \
    --db-instance-identifier storemybottle-db \
    --db-instance-class db.t3.small \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username admin \
    --master-user-password YourStrongPassword123! \
    --allocated-storage 20 \
    --storage-encrypted \
    --backup-retention-period 7 \
    --multi-az \
    --publicly-accessible false

# Wait for it to be ready
aws rds wait db-instance-available --db-instance-identifier storemybottle-db

# Get the endpoint
export DB_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier storemybottle-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "Database endpoint: $DB_ENDPOINT"
```

### 2.2 Initialize Database
```bash
# Connect to database and create schema
mysql -h $DB_ENDPOINT -u admin -p < backend/init_db.sql
```

---

## Step 3: Store Secrets (10 minutes)

```bash
# Generate JWT secrets
export JWT_SECRET=$(openssl rand -base64 48)
export JWT_REFRESH_SECRET=$(openssl rand -base64 48)

# Store in Secrets Manager
aws secretsmanager create-secret \
    --name storemybottle/database \
    --secret-string "{\"username\":\"admin\",\"password\":\"YourStrongPassword123!\",\"host\":\"$DB_ENDPOINT\",\"port\":3306,\"dbname\":\"storemybottle\"}"

aws secretsmanager create-secret \
    --name storemybottle/jwt \
    --secret-string "{\"JWT_SECRET\":\"$JWT_SECRET\",\"JWT_REFRESH_SECRET\":\"$JWT_REFRESH_SECRET\"}"

aws secretsmanager create-secret \
    --name storemybottle/config \
    --secret-string "{\"CORS_ORIGINS\":\"https://app.$DOMAIN_NAME,https://bartender.$DOMAIN_NAME,https://admin.$DOMAIN_NAME\"}"
```

---

## Step 4: Backend Deployment (45 minutes)

### 4.1 Create ECR Repository
```bash
aws ecr create-repository --repository-name storemybottle-backend
export ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/storemybottle-backend
```

### 4.2 Build and Push Docker Image
```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

# Build image
cd backend
docker build -t storemybottle-backend -f Dockerfile.aws .
docker tag storemybottle-backend:latest $ECR_URI:latest

# Push to ECR
docker push $ECR_URI:latest
cd ..
```

### 4.3 Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name storemybottle-cluster
```

### 4.4 Create Task Definition
```bash
# Create task-definition.json with your values
cat > task-definition.json << EOF
{
  "family": "storemybottle-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::$AWS_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "$ECR_URI:latest",
      "portMappings": [{"containerPort": 8000}],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/storemybottle-backend",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
        }
      }
    }
  ]
}
EOF

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### 4.5 Create Load Balancer
```bash
# Get default VPC and subnets
export VPC_ID=$(aws ec2 describe-vpcs --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text)
export SUBNET_1=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text)
export SUBNET_2=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[1].SubnetId' --output text)

# Create security group for ALB
export ALB_SG=$(aws ec2 create-security-group \
    --group-name storemybottle-alb-sg \
    --description "Security group for StoreMyBottle ALB" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text)

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0

# Create ALB
export ALB_ARN=$(aws elbv2 create-load-balancer \
    --name storemybottle-alb \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $ALB_SG \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

# Create target group
export TG_ARN=$(aws elbv2 create-target-group \
    --name storemybottle-tg \
    --protocol HTTP \
    --port 8000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /health \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

# Create listener
aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN
```

### 4.6 Create ECS Service
```bash
# Create security group for ECS tasks
export ECS_SG=$(aws ec2 create-security-group \
    --group-name storemybottle-ecs-sg \
    --description "Security group for StoreMyBottle ECS tasks" \
    --vpc-id $VPC_ID \
    --query 'GroupId' --output text)

# Allow traffic from ALB
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG \
    --protocol tcp \
    --port 8000 \
    --source-group $ALB_SG

# Create ECS service
aws ecs create-service \
    --cluster storemybottle-cluster \
    --service-name storemybottle-backend-service \
    --task-definition storemybottle-backend \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_1,$SUBNET_2],securityGroups=[$ECS_SG],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=$TG_ARN,containerName=backend,containerPort=8000"
```

---

## Step 5: Frontend Deployment (30 minutes)

### 5.1 Create S3 Buckets
```bash
# Customer app
aws s3 mb s3://storemybottle-customer-app
aws s3 website s3://storemybottle-customer-app --index-document index.html

# Bartender app
aws s3 mb s3://storemybottle-bartender-app
aws s3 website s3://storemybottle-bartender-app --index-document index.html

# Admin panel
aws s3 mb s3://storemybottle-admin-panel
aws s3 website s3://storemybottle-admin-panel --index-document index.html
```

### 5.2 Build and Upload Frontends
```bash
# Get ALB DNS name
export ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' --output text)

# Customer app
cd frontend
echo "VITE_API_URL=http://$ALB_DNS" > .env.production
npm ci
npm run build
aws s3 sync dist/ s3://storemybottle-customer-app
cd ..

# Bartender app
cd frontend-bartender
echo "VITE_API_URL=http://$ALB_DNS" > .env.production
npm ci
npm run build
aws s3 sync dist/ s3://storemybottle-bartender-app
cd ..

# Admin panel
cd admin
echo "VITE_API_URL=http://$ALB_DNS" > .env.production
npm ci
npm run build
aws s3 sync dist/ s3://storemybottle-admin-panel
cd ..
```

### 5.3 Make Buckets Public
```bash
# For each bucket, apply this policy
for BUCKET in storemybottle-customer-app storemybottle-bartender-app storemybottle-admin-panel; do
  aws s3api put-bucket-policy --bucket $BUCKET --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::$BUCKET/*\"
    }]
  }"
done
```

---

## Step 6: Test Your Deployment (15 minutes)

### 6.1 Test Backend
```bash
# Get ALB DNS
echo "Backend API: http://$ALB_DNS"

# Test health endpoint
curl http://$ALB_DNS/health

# Test API docs
open http://$ALB_DNS/docs
```

### 6.2 Test Frontends
```bash
# Get S3 website URLs
echo "Customer App: http://storemybottle-customer-app.s3-website-$AWS_REGION.amazonaws.com"
echo "Bartender App: http://storemybottle-bartender-app.s3-website-$AWS_REGION.amazonaws.com"
echo "Admin Panel: http://storemybottle-admin-panel.s3-website-$AWS_REGION.amazonaws.com"

# Open in browser
open http://storemybottle-customer-app.s3-website-$AWS_REGION.amazonaws.com
```

---

## Step 7: Set Up Custom Domain (Optional, 30 minutes)

### 7.1 Request SSL Certificate
```bash
# Request certificate for your domain
aws acm request-certificate \
    --domain-name $DOMAIN_NAME \
    --subject-alternative-names "*.$DOMAIN_NAME" \
    --validation-method DNS

# Follow the email/DNS validation process
```

### 7.2 Create CloudFront Distributions
```bash
# This is more complex - see full deployment guide
# Or use AWS Console for easier setup
```

### 7.3 Update Route 53
```bash
# Create hosted zone
aws route53 create-hosted-zone --name $DOMAIN_NAME --caller-reference $(date +%s)

# Add A records pointing to CloudFront distributions
```

---

## 🎉 You're Live!

Your app is now deployed on AWS! Here's what you have:

- ✅ Backend API running on ECS Fargate
- ✅ MySQL database on RDS
- ✅ Three frontend apps on S3
- ✅ Load balancer for high availability
- ✅ Auto-scaling enabled
- ✅ Secure secrets management

---

## 📊 Monitor Your App

### CloudWatch Dashboard
```bash
# View logs
aws logs tail /ecs/storemybottle-backend --follow

# View metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/ECS \
    --metric-name CPUUtilization \
    --dimensions Name=ServiceName,Value=storemybottle-backend-service \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average
```

---

## 🔄 Update Your App

### Backend Update
```bash
# Build new image
cd backend
docker build -t storemybottle-backend -f Dockerfile.aws .
docker tag storemybottle-backend:latest $ECR_URI:latest
docker push $ECR_URI:latest

# Force new deployment
aws ecs update-service \
    --cluster storemybottle-cluster \
    --service storemybottle-backend-service \
    --force-new-deployment
```

### Frontend Update
```bash
# Rebuild and upload
cd frontend
npm run build
aws s3 sync dist/ s3://storemybottle-customer-app --delete
```

---

## 💰 Cost Optimization Tips

1. **Use Fargate Spot** for non-critical workloads (50-70% cheaper)
2. **Enable S3 Intelligent-Tiering** for automatic cost optimization
3. **Use CloudFront** to reduce data transfer costs
4. **Set up auto-scaling** to scale down during low traffic
5. **Use Reserved Instances** for RDS if running 24/7

---

## 🆘 Troubleshooting

### Backend not starting?
```bash
# Check ECS service events
aws ecs describe-services \
    --cluster storemybottle-cluster \
    --services storemybottle-backend-service

# Check logs
aws logs tail /ecs/storemybottle-backend --follow
```

### Can't connect to database?
```bash
# Check security groups
# Make sure ECS security group can access RDS security group on port 3306
```

### Frontend not loading?
```bash
# Check S3 bucket policy
# Make sure bucket is public
# Check CORS configuration
```

---

## 📚 Next Steps

1. **Set up CI/CD** - See [CICD_SETUP_GUIDE.md](./CICD_SETUP_GUIDE.md)
2. **Add custom domain** - See [AWS_DEPLOYMENT_PLAN.md](./AWS_DEPLOYMENT_PLAN.md)
3. **Enable monitoring** - Set up CloudWatch dashboards and alarms
4. **Implement backups** - Configure automated RDS snapshots
5. **Add WAF** - Protect against common web attacks

---

**Congratulations! Your app is live on AWS! 🚀**

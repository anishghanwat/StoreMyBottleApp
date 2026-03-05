# CI/CD Setup Guide - AWS CodePipeline

## Overview

This guide walks you through setting up a complete CI/CD pipeline for StoreMyBottle using AWS CodePipeline, CodeBuild, and CodeDeploy.

---

## 🎯 Pipeline Architecture

```
GitHub (Source)
    ↓
CodePipeline (Orchestration)
    ↓
┌───────────────┬────────────────┬────────────────┬────────────────┐
│   Backend     │   Customer     │   Bartender    │     Admin      │
│   CodeBuild   │   CodeBuild    │   CodeBuild    │   CodeBuild    │
└───────┬───────┴────────┬───────┴────────┬───────┴────────┬───────┘
        │                │                │                │
        ↓                ↓                ↓                ↓
    ECS Fargate      S3 + CF         S3 + CF         S3 + CF
```

---

## 📋 Prerequisites

### 1. AWS Account Setup
- [ ] AWS account created
- [ ] IAM user with admin access
- [ ] AWS CLI installed and configured
- [ ] AWS credentials configured locally

### 2. GitHub Setup
- [ ] Code pushed to GitHub repository
- [ ] GitHub personal access token created (for CodePipeline)

### 3. Domain & SSL
- [ ] Domain purchased (e.g., storemybottle.com)
- [ ] Domain verified in Route 53
- [ ] SSL certificates requested in ACM

---

## 🚀 Step-by-Step Setup

### Step 1: Create ECR Repository

```bash
# Create ECR repository for backend Docker images
aws ecr create-repository \
    --repository-name storemybottle-backend \
    --region us-east-1

# Note the repository URI (you'll need this later)
# Example: 123456789012.dkr.ecr.us-east-1.amazonaws.com/storemybottle-backend
```

### Step 2: Create S3 Buckets for Frontends

```bash
# Customer app bucket
aws s3 mb s3://storemybottle-customer-app --region us-east-1
aws s3 website s3://storemybottle-customer-app --index-document index.html

# Bartender app bucket
aws s3 mb s3://storemybottle-bartender-app --region us-east-1
aws s3 website s3://storemybottle-bartender-app --index-document index.html

# Admin panel bucket
aws s3 mb s3://storemybottle-admin-panel --region us-east-1
aws s3 website s3://storemybottle-admin-panel --index-document index.html

# Configure bucket policies (see below)
```

**S3 Bucket Policy** (for each bucket):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

### Step 3: Create CloudFront Distributions

For each frontend (customer, bartender, admin):

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
    --origin-domain-name storemybottle-customer-app.s3.amazonaws.com \
    --default-root-object index.html

# Note the distribution ID and domain name
```

**CloudFront Configuration**:
- Origin: S3 bucket
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Allowed HTTP Methods: GET, HEAD, OPTIONS
- Cached HTTP Methods: GET, HEAD, OPTIONS
- Compress Objects Automatically: Yes
- Price Class: Use All Edge Locations
- Alternate Domain Names (CNAMEs): app.storemybottle.com
- SSL Certificate: Custom SSL Certificate (from ACM)

### Step 4: Create RDS MySQL Database

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
    --db-subnet-group-name storemybottle-db-subnet \
    --db-subnet-group-description "Subnet group for StoreMyBottle DB" \
    --subnet-ids subnet-xxxxx subnet-yyyyy

# Create RDS instance
aws rds create-db-instance \
    --db-instance-identifier storemybottle-db \
    --db-instance-class db.t3.small \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username admin \
    --master-user-password <STRONG_PASSWORD> \
    --allocated-storage 20 \
    --storage-type gp3 \
    --storage-encrypted \
    --backup-retention-period 7 \
    --multi-az \
    --db-subnet-group-name storemybottle-db-subnet \
    --vpc-security-group-ids sg-xxxxx \
    --publicly-accessible false \
    --enable-cloudwatch-logs-exports '["error","general","slowquery"]'

# Wait for DB to be available (takes 10-15 minutes)
aws rds wait db-instance-available --db-instance-identifier storemybottle-db

# Get the endpoint
aws rds describe-db-instances \
    --db-instance-identifier storemybottle-db \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
```

### Step 5: Store Secrets in AWS Secrets Manager

```bash
# Database credentials
aws secretsmanager create-secret \
    --name storemybottle/database \
    --description "Database credentials for StoreMyBottle" \
    --secret-string '{
      "username": "admin",
      "password": "<DB_PASSWORD>",
      "engine": "mysql",
      "host": "<RDS_ENDPOINT>",
      "port": 3306,
      "dbname": "storemybottle"
    }'

# JWT secrets
aws secretsmanager create-secret \
    --name storemybottle/jwt \
    --description "JWT secrets for StoreMyBottle" \
    --secret-string '{
      "JWT_SECRET": "<64_CHAR_SECRET>",
      "JWT_REFRESH_SECRET": "<64_CHAR_SECRET>"
    }'

# Application config
aws secretsmanager create-secret \
    --name storemybottle/config \
    --description "Application configuration" \
    --secret-string '{
      "CORS_ORIGINS": "https://app.storemybottle.com,https://bartender.storemybottle.com,https://admin.storemybottle.com"
    }'
```

### Step 6: Create ECS Cluster and Task Definition

```bash
# Create ECS cluster
aws ecs create-cluster \
    --cluster-name storemybottle-cluster \
    --capacity-providers FARGATE FARGATE_SPOT \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1

# Create task execution role
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://ecs-task-execution-role.json

# Attach policies
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create task definition (see task-definition.json below)
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

**task-definition.json**:
```json
{
  "family": "storemybottle-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/storemybottle-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storemybottle/database"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storemybottle/jwt:JWT_SECRET::"
        },
        {
          "name": "JWT_REFRESH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storemybottle/jwt:JWT_REFRESH_SECRET::"
        },
        {
          "name": "CORS_ORIGINS",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:storemybottle/config:CORS_ORIGINS::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/storemybottle-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs",
          "awslogs-create-group": "true"
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

### Step 7: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name storemybottle-alb \
    --subnets subnet-xxxxx subnet-yyyyy \
    --security-groups sg-xxxxx \
    --scheme internet-facing \
    --type application \
    --ip-address-type ipv4

# Create target group
aws elbv2 create-target-group \
    --name storemybottle-tg \
    --protocol HTTP \
    --port 8000 \
    --vpc-id vpc-xxxxx \
    --target-type ip \
    --health-check-enabled \
    --health-check-path /health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3

# Create listener (HTTP - will redirect to HTTPS)
aws elbv2 create-listener \
    --load-balancer-arn <ALB_ARN> \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}

# Create listener (HTTPS)
aws elbv2 create-listener \
    --load-balancer-arn <ALB_ARN> \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=<ACM_CERT_ARN> \
    --default-actions Type=forward,TargetGroupArn=<TARGET_GROUP_ARN>
```

### Step 8: Create ECS Service

```bash
# Create ECS service
aws ecs create-service \
    --cluster storemybottle-cluster \
    --service-name storemybottle-backend-service \
    --task-definition storemybottle-backend \
    --desired-count 2 \
    --launch-type FARGATE \
    --platform-version LATEST \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=<TARGET_GROUP_ARN>,containerName=backend,containerPort=8000" \
    --health-check-grace-period-seconds 60 \
    --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100" \
    --enable-execute-command
```

### Step 9: Set Up Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --resource-id service/storemybottle-cluster/storemybottle-backend-service \
    --scalable-dimension ecs:service:DesiredCount \
    --min-capacity 2 \
    --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
    --service-namespace ecs \
    --resource-id service/storemybottle-cluster/storemybottle-backend-service \
    --scalable-dimension ecs:service:DesiredCount \
    --policy-name cpu-scaling-policy \
    --policy-type TargetTrackingScaling \
    --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

**scaling-policy.json**:
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleOutCooldown": 60,
  "ScaleInCooldown": 300
}
```

### Step 10: Create CodeBuild Projects

**Backend Build Project**:
```bash
aws codebuild create-project \
    --name storemybottle-backend-build \
    --source type=GITHUB,location=https://github.com/anishghanwat/StoreMyBottleApp.git,buildspec=buildspec-backend.yml \
    --artifacts type=NO_ARTIFACTS \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=true \
    --service-role arn:aws:iam::ACCOUNT_ID:role/CodeBuildServiceRole \
    --environment-variables-override \
        name=AWS_ACCOUNT_ID,value=ACCOUNT_ID,type=PLAINTEXT \
        name=AWS_DEFAULT_REGION,value=us-east-1,type=PLAINTEXT
```

**Frontend Build Projects** (repeat for customer, bartender, admin):
```bash
aws codebuild create-project \
    --name storemybottle-frontend-customer-build \
    --source type=GITHUB,location=https://github.com/anishghanwat/StoreMyBottleApp.git,buildspec=buildspec-frontend-customer.yml \
    --artifacts type=NO_ARTIFACTS \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL \
    --service-role arn:aws:iam::ACCOUNT_ID:role/CodeBuildServiceRole \
    --environment-variables-override \
        name=S3_BUCKET_CUSTOMER,value=storemybottle-customer-app,type=PLAINTEXT \
        name=CLOUDFRONT_DIST_ID_CUSTOMER,value=DISTRIBUTION_ID,type=PLAINTEXT
```

### Step 11: Create CodePipeline

```bash
aws codepipeline create-pipeline --cli-input-json file://pipeline.json
```

**pipeline.json**:
```json
{
  "pipeline": {
    "name": "StoreMyBottle-Pipeline",
    "roleArn": "arn:aws:iam::ACCOUNT_ID:role/CodePipelineServiceRole",
    "artifactStore": {
      "type": "S3",
      "location": "codepipeline-artifacts-bucket"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [
          {
            "name": "Source",
            "actionTypeId": {
              "category": "Source",
              "owner": "ThirdParty",
              "provider": "GitHub",
              "version": "1"
            },
            "configuration": {
              "Owner": "anishghanwat",
              "Repo": "StoreMyBottleApp",
              "Branch": "main",
              "OAuthToken": "{{resolve:secretsmanager:github-token}}"
            },
            "outputArtifacts": [
              {
                "name": "SourceOutput"
              }
            ]
          }
        ]
      },
      {
        "name": "Build",
        "actions": [
          {
            "name": "BuildBackend",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "storemybottle-backend-build"
            },
            "inputArtifacts": [
              {
                "name": "SourceOutput"
              }
            ],
            "outputArtifacts": [
              {
                "name": "BackendBuildOutput"
              }
            ],
            "runOrder": 1
          },
          {
            "name": "BuildFrontendCustomer",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "storemybottle-frontend-customer-build"
            },
            "inputArtifacts": [
              {
                "name": "SourceOutput"
              }
            ],
            "runOrder": 1
          },
          {
            "name": "BuildFrontendBartender",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "storemybottle-frontend-bartender-build"
            },
            "inputArtifacts": [
              {
                "name": "SourceOutput"
              }
            ],
            "runOrder": 1
          },
          {
            "name": "BuildFrontendAdmin",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "storemybottle-frontend-admin-build"
            },
            "inputArtifacts": [
              {
                "name": "SourceOutput"
              }
            ],
            "runOrder": 1
          }
        ]
      },
      {
        "name": "Deploy",
        "actions": [
          {
            "name": "DeployBackend",
            "actionTypeId": {
              "category": "Deploy",
              "owner": "AWS",
              "provider": "ECS",
              "version": "1"
            },
            "configuration": {
              "ClusterName": "storemybottle-cluster",
              "ServiceName": "storemybottle-backend-service",
              "FileName": "imagedefinitions.json"
            },
            "inputArtifacts": [
              {
                "name": "BackendBuildOutput"
              }
            ],
            "runOrder": 1
          }
        ]
      }
    ]
  }
}
```

---

## 🔐 IAM Roles and Policies

### CodeBuild Service Role

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "codebuild.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

**Permissions Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

### CodePipeline Service Role

Similar trust and permissions policies for CodePipeline to access CodeBuild, ECS, S3, etc.

---

## 🧪 Testing the Pipeline

### 1. Manual Trigger
```bash
# Start pipeline execution
aws codepipeline start-pipeline-execution \
    --name StoreMyBottle-Pipeline
```

### 2. Monitor Pipeline
```bash
# Get pipeline state
aws codepipeline get-pipeline-state \
    --name StoreMyBottle-Pipeline
```

### 3. View Build Logs
```bash
# Get build logs
aws codebuild batch-get-builds \
    --ids <BUILD_ID>
```

---

## 🔄 Automated Deployments

Once set up, the pipeline will automatically:

1. **Detect changes** in GitHub main branch
2. **Build** all components in parallel
3. **Test** backend (unit tests)
4. **Deploy** backend to ECS
5. **Deploy** frontends to S3
6. **Invalidate** CloudFront caches
7. **Notify** via SNS (optional)

---

## 📊 Monitoring

### CloudWatch Dashboards

Create a dashboard to monitor:
- Pipeline execution status
- Build success/failure rates
- Deployment duration
- Application metrics

### Alarms

Set up alarms for:
- Pipeline failures
- Build failures
- Deployment failures
- High error rates post-deployment

---

## 🎯 Best Practices

1. **Use separate pipelines** for staging and production
2. **Implement approval gates** before production deployment
3. **Run automated tests** in the pipeline
4. **Use blue/green deployments** for zero-downtime
5. **Tag Docker images** with commit hash
6. **Keep secrets in Secrets Manager**, not in code
7. **Monitor pipeline metrics** and set up alerts
8. **Implement rollback strategy**

---

## 🆘 Troubleshooting

### Build Fails
- Check CodeBuild logs in CloudWatch
- Verify IAM permissions
- Check buildspec.yml syntax

### Deployment Fails
- Check ECS service events
- Verify task definition
- Check security groups and networking
- Review ALB target group health checks

### Frontend Not Updating
- Verify S3 sync completed
- Check CloudFront invalidation
- Clear browser cache

---

## 📚 Next Steps

1. Set up staging environment
2. Implement automated testing
3. Add approval gates
4. Set up monitoring dashboards
5. Configure backup and disaster recovery

---

**Your CI/CD pipeline is now ready! Every push to main will automatically deploy to production.**

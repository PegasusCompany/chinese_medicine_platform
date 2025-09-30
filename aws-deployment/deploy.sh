#!/bin/bash

# Chinese Medicine Platform - AWS Deployment Script
# This script deploys the application to AWS using CloudFormation and ECS

set -e

# Configuration
PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"  # Change this to your preferred region
ENVIRONMENT="production"
DB_PASSWORD="ChineseMedicine2024!"
JWT_SECRET="your-super-secret-jwt-key-for-hackathon-2024-$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting AWS deployment for Chinese Medicine Platform${NC}"
echo -e "${BLUE}=================================================${NC}"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}📋 AWS Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${BLUE}📋 Region: ${REGION}${NC}"

# Create ECR repositories if they don't exist
echo -e "${YELLOW}🏗️  Creating ECR repositories...${NC}"

aws ecr describe-repositories --repository-names "${PROJECT_NAME}-backend" --region ${REGION} 2>/dev/null || \
aws ecr create-repository --repository-name "${PROJECT_NAME}-backend" --region ${REGION}

aws ecr describe-repositories --repository-names "${PROJECT_NAME}-frontend" --region ${REGION} 2>/dev/null || \
aws ecr create-repository --repository-name "${PROJECT_NAME}-frontend" --region ${REGION}

echo -e "${GREEN}✅ ECR repositories ready${NC}"

# Get ECR login token
echo -e "${YELLOW}🔐 Logging into ECR...${NC}"
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com

# Build and push Docker images
echo -e "${YELLOW}🐳 Building and pushing Docker images...${NC}"

# Backend
echo -e "${BLUE}Building backend image...${NC}"
cd ../backend
docker build -f Dockerfile.prod -t ${PROJECT_NAME}-backend .
docker tag ${PROJECT_NAME}-backend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest

BACKEND_IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest"
echo -e "${GREEN}✅ Backend image pushed: ${BACKEND_IMAGE_URI}${NC}"

# Frontend
echo -e "${BLUE}Building frontend image...${NC}"
cd ../frontend
# Get the ALB DNS name for API URL (we'll update this after infrastructure is deployed)
REACT_APP_API_URL="http://PLACEHOLDER_ALB_DNS"
docker build -f Dockerfile.prod --build-arg REACT_APP_API_URL=${REACT_APP_API_URL} -t ${PROJECT_NAME}-frontend .
docker tag ${PROJECT_NAME}-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest

FRONTEND_IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest"
echo -e "${GREEN}✅ Frontend image pushed: ${FRONTEND_IMAGE_URI}${NC}"

cd ../aws-deployment

# Deploy infrastructure
echo -e "${YELLOW}🏗️  Deploying infrastructure...${NC}"
aws cloudformation deploy \
    --template-file cloudformation/infrastructure.yml \
    --stack-name ${PROJECT_NAME}-infrastructure \
    --parameter-overrides \
        ProjectName=${PROJECT_NAME} \
        Environment=${ENVIRONMENT} \
        DBPassword=${DB_PASSWORD} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

echo -e "${GREEN}✅ Infrastructure deployed${NC}"

# Get infrastructure outputs
echo -e "${YELLOW}📋 Getting infrastructure details...${NC}"
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name ${PROJECT_NAME}-infrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text \
    --region ${REGION})

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name ${PROJECT_NAME}-infrastructure \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text \
    --region ${REGION})

echo -e "${BLUE}📋 Load Balancer DNS: ${ALB_DNS}${NC}"
echo -e "${BLUE}📋 Database Endpoint: ${DB_ENDPOINT}${NC}"

# Rebuild frontend with correct API URL
echo -e "${YELLOW}🔄 Rebuilding frontend with correct API URL...${NC}"
cd ../frontend
REACT_APP_API_URL="http://${ALB_DNS}"
docker build -f Dockerfile.prod --build-arg REACT_APP_API_URL=${REACT_APP_API_URL} -t ${PROJECT_NAME}-frontend .
docker tag ${PROJECT_NAME}-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest

echo -e "${GREEN}✅ Frontend image updated with correct API URL${NC}"

cd ../aws-deployment

# Create database URL
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${DB_ENDPOINT}:5432/chinese_medicine_db"

# Deploy services
echo -e "${YELLOW}🚀 Deploying ECS services...${NC}"
aws cloudformation deploy \
    --template-file cloudformation/services.yml \
    --stack-name ${PROJECT_NAME}-services \
    --parameter-overrides \
        ProjectName=${PROJECT_NAME} \
        Environment=${ENVIRONMENT} \
        BackendImageURI=${BACKEND_IMAGE_URI} \
        FrontendImageURI=${FRONTEND_IMAGE_URI} \
        DatabaseURL=${DATABASE_URL} \
        JWTSecret=${JWT_SECRET} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}

echo -e "${GREEN}✅ ECS services deployed${NC}"

# Wait for services to be stable
echo -e "${YELLOW}⏳ Waiting for services to be stable...${NC}"
aws ecs wait services-stable \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend \
    --region ${REGION}

echo -e "${GREEN}✅ Services are stable${NC}"

# Initialize database
echo -e "${YELLOW}🗄️  Initializing database...${NC}"
echo -e "${BLUE}Running database setup...${NC}"

# Get the backend task ARN
BACKEND_TASK_ARN=$(aws ecs list-tasks \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name ${PROJECT_NAME}-backend \
    --query 'taskArns[0]' \
    --output text \
    --region ${REGION})

if [ "$BACKEND_TASK_ARN" != "None" ] && [ "$BACKEND_TASK_ARN" != "" ]; then
    echo -e "${BLUE}Executing database setup in backend container...${NC}"
    
    # Run database setup
    aws ecs execute-command \
        --cluster ${PROJECT_NAME}-cluster \
        --task ${BACKEND_TASK_ARN} \
        --container backend \
        --interactive \
        --command "npm run setup" \
        --region ${REGION} || echo -e "${YELLOW}⚠️  Database setup command failed, you may need to run it manually${NC}"
else
    echo -e "${YELLOW}⚠️  Could not find backend task, you'll need to initialize the database manually${NC}"
fi

# Get final application URL
APPLICATION_URL=$(aws cloudformation describe-stacks \
    --stack-name ${PROJECT_NAME}-services \
    --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
    --output text \
    --region ${REGION})

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}🌐 Application URL: ${APPLICATION_URL}${NC}"
echo -e "${GREEN}📊 CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups${NC}"
echo -e "${GREEN}🐳 ECS Console: https://console.aws.amazon.com/ecs/home?region=${REGION}#/clusters/${PROJECT_NAME}-cluster${NC}"
echo -e "${GREEN}=================================================${NC}"

echo -e "${BLUE}📋 Test Credentials:${NC}"
echo -e "${BLUE}   Practitioner: practitioner@test.com / password123${NC}"
echo -e "${BLUE}   Suppliers: supplier@test.com, dragonwell@test.com, etc. / password123${NC}"

echo -e "${YELLOW}⚠️  Note: If the database setup failed, you can run it manually:${NC}"
echo -e "${YELLOW}   1. Go to ECS Console${NC}"
echo -e "${YELLOW}   2. Find the backend task${NC}"
echo -e "${YELLOW}   3. Execute command: npm run setup${NC}"

echo -e "${GREEN}🚀 Your Chinese Medicine Platform is now live on AWS!${NC}"
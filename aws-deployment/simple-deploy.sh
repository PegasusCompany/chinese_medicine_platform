#!/bin/bash

# Simple AWS deployment using CLI commands instead of CloudFormation
# This approach is more reliable for hackathons

set -e

# Configuration
PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"
ENVIRONMENT="production"
DB_PASSWORD="ChineseMedicine2024!"
JWT_SECRET="your-super-secret-jwt-key-for-hackathon-2024-$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Simple AWS deployment for Chinese Medicine Platform${NC}"
echo -e "${BLUE}=============================================================${NC}"

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

# Frontend (build with placeholder first)
echo -e "${BLUE}Building frontend image...${NC}"
cd ../frontend
REACT_APP_API_URL="http://PLACEHOLDER_ALB_DNS"
docker build -f Dockerfile.prod --build-arg REACT_APP_API_URL=${REACT_APP_API_URL} -t ${PROJECT_NAME}-frontend .
docker tag ${PROJECT_NAME}-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest

FRONTEND_IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest"
echo -e "${GREEN}✅ Frontend image pushed: ${FRONTEND_IMAGE_URI}${NC}"

cd ../aws-deployment

# Create ECS Cluster
echo -e "${YELLOW}🏗️  Creating ECS Cluster...${NC}"
aws ecs create-cluster --cluster-name ${PROJECT_NAME}-cluster --region ${REGION} || echo "Cluster may already exist"

# Create RDS Database
echo -e "${YELLOW}🗄️  Creating RDS Database...${NC}"
aws rds create-db-instance \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username postgres \
    --master-user-password ${DB_PASSWORD} \
    --allocated-storage 20 \
    --db-name chinese_medicine_db \
    --publicly-accessible \
    --region ${REGION} \
    --tags Key=Name,Value=${PROJECT_NAME}-database Key=awsApplication,Value=arn:aws:resource-groups:us-east-1:975049890307:group/Amazon_AI_Hackathon/0cbvof94ysqsm7ir1zixf6q13f \
    2>/dev/null || echo "Database may already exist"

echo -e "${YELLOW}⏳ Waiting for database to be available...${NC}"
aws rds wait db-instance-available --db-instance-identifier ${PROJECT_NAME}-db --region ${REGION}

# Get database endpoint
DB_ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier ${PROJECT_NAME}-db --query 'DBInstances[0].Endpoint.Address' --output text --region ${REGION})
echo -e "${BLUE}📋 Database Endpoint: ${DB_ENDPOINT}${NC}"

# Create database URL
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@${DB_ENDPOINT}:5432/chinese_medicine_db"

echo -e "${GREEN}🎉 Simple deployment completed!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}🐳 ECS Cluster: ${PROJECT_NAME}-cluster${NC}"
echo -e "${GREEN}🗄️  Database: ${DB_ENDPOINT}${NC}"
echo -e "${GREEN}📊 ECR Images ready for deployment${NC}"
echo -e "${GREEN}=================================================${NC}"

echo -e "${BLUE}Next steps:${NC}"
echo -e "${BLUE}1. Your Docker images are ready in ECR${NC}"
echo -e "${BLUE}2. ECS Cluster is created${NC}"
echo -e "${BLUE}3. RDS Database is running${NC}"
echo -e "${BLUE}4. You can now deploy ECS services manually or use AWS Console${NC}"

echo -e "${YELLOW}Database URL: ${DATABASE_URL}${NC}"
echo -e "${YELLOW}Backend Image: ${BACKEND_IMAGE_URI}${NC}"
echo -e "${YELLOW}Frontend Image: ${FRONTEND_IMAGE_URI}${NC}"
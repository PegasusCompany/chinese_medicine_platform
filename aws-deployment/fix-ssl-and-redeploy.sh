#!/bin/bash

# Chinese Medicine Platform - Fix SSL and Redeploy Backend
# This script fixes the SSL issue and redeploys the backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing SSL and Redeploying Backend${NC}"
echo -e "${BLUE}====================================${NC}"

PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"
ACCOUNT_ID="975049890307"

# Get ECR repository URI
BACKEND_REPO_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend"

echo -e "${YELLOW}🐳 Building and pushing updated backend image...${NC}"

# Navigate to project root
cd ..

# Login to ECR
echo -e "${YELLOW}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${BACKEND_REPO_URI}

# Build and push backend image
echo -e "${YELLOW}🏗️  Building backend image...${NC}"
docker build -t ${PROJECT_NAME}-backend ./backend

echo -e "${YELLOW}📤 Pushing backend image to ECR...${NC}"
docker tag ${PROJECT_NAME}-backend:latest ${BACKEND_REPO_URI}:latest
docker push ${BACKEND_REPO_URI}:latest

echo -e "${GREEN}✅ Backend image updated${NC}"

# Force new deployment of backend service
echo -e "${YELLOW}🚀 Forcing new deployment of backend service...${NC}"
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-backend \
    --force-new-deployment \
    --region ${REGION}

echo -e "${GREEN}✅ Backend service deployment initiated${NC}"

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"
aws ecs wait services-stable \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-backend \
    --region ${REGION}

echo -e "${GREEN}✅ Backend deployment completed${NC}"

echo -e "${BLUE}====================================${NC}"
echo -e "${GREEN}🎉 SSL fix applied and backend redeployed!${NC}"
echo -e "${BLUE}====================================${NC}"

echo -e "${YELLOW}💡 Now try the database setup again:${NC}"
echo -e "${BLUE}1. Get new task ID:${NC}"
echo -e "${BLUE}   aws ecs list-tasks --cluster ${PROJECT_NAME}-cluster --service-name ${PROJECT_NAME}-backend --desired-status RUNNING --query 'taskArns[0]' --output text${NC}"
echo -e "${BLUE}2. Run setup with new task ID:${NC}"
echo -e "${BLUE}   aws ecs execute-command --cluster ${PROJECT_NAME}-cluster --task [NEW-TASK-ID] --container backend --interactive --command \"npm run setup\"${NC}"
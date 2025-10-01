#!/bin/bash

# Chinese Medicine Platform - Fix Frontend API URL
# This script rebuilds the frontend with the correct API URL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Frontend API URL${NC}"
echo -e "${BLUE}==========================${NC}"

PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"
ACCOUNT_ID="975049890307"

# Get backend IP
BACKEND_IP=$(aws ecs list-tasks --cluster chinese-medicine-platform-cluster --service-name chinese-medicine-platform-backend --desired-status RUNNING --query 'taskArns[0]' --output text | xargs -I {} aws ecs describe-tasks --cluster chinese-medicine-platform-cluster --tasks {} --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

echo -e "${GREEN}✅ Backend IP: ${BACKEND_IP}${NC}"

# Get ECR repository URI
FRONTEND_REPO_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend"

echo -e "${YELLOW}🐳 Building frontend with correct API URL...${NC}"

# Navigate to project root
cd ..

# Login to ECR
echo -e "${YELLOW}🔐 Logging in to ECR...${NC}"
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${FRONTEND_REPO_URI}

# Build frontend with correct API URL for AMD64 architecture
echo -e "${YELLOW}🏗️  Building frontend image with API URL: http://${BACKEND_IP}:5000${NC}"
cd frontend
docker build --platform linux/amd64 -t ${PROJECT_NAME}-frontend --build-arg REACT_APP_API_URL=http://${BACKEND_IP}:5000 -f Dockerfile.prod .

echo -e "${YELLOW}📤 Pushing frontend image to ECR...${NC}"
docker tag ${PROJECT_NAME}-frontend:latest ${FRONTEND_REPO_URI}:latest
docker push ${FRONTEND_REPO_URI}:latest

echo -e "${GREEN}✅ Frontend image updated${NC}"

# Force new deployment of frontend service
echo -e "${YELLOW}🚀 Forcing new deployment of frontend service...${NC}"
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-frontend \
    --force-new-deployment \
    --region ${REGION}

echo -e "${GREEN}✅ Frontend service deployment initiated${NC}"

# Wait for deployment to complete
echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"
aws ecs wait services-stable \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-frontend \
    --region ${REGION}

echo -e "${GREEN}✅ Frontend deployment completed${NC}"

# Get new frontend IP
FRONTEND_IP=$(aws ecs list-tasks --cluster chinese-medicine-platform-cluster --service-name chinese-medicine-platform-frontend --desired-status RUNNING --query 'taskArns[0]' --output text | xargs -I {} aws ecs describe-tasks --cluster chinese-medicine-platform-cluster --tasks {} --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

echo -e "${BLUE}==========================${NC}"
echo -e "${GREEN}🎉 Frontend API URL fixed!${NC}"
echo -e "${BLUE}==========================${NC}"

echo -e "${YELLOW}🌐 Your application is now ready:${NC}"
echo -e "${GREEN}   Frontend: http://${FRONTEND_IP}:3000${NC}"
echo -e "${GREEN}   Backend: http://${BACKEND_IP}:5000${NC}"

echo -e "${YELLOW}👤 Login credentials:${NC}"
echo -e "${BLUE}   Email: practitioner@test.com${NC}"
echo -e "${BLUE}   Password: password123${NC}"
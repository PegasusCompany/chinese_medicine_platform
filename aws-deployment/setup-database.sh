#!/bin/bash

# Chinese Medicine Platform - Database Setup Script for AWS
# This script initializes the database on your deployed AWS instance

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Setting up Chinese Medicine Platform Database${NC}"
echo -e "${BLUE}=================================================${NC}"

# Get backend IP from ECS
echo -e "${YELLOW}📋 Getting backend IP address...${NC}"

BACKEND_TASK=$(aws ecs list-tasks \
  --cluster chinese-medicine-platform-cluster \
  --service-name chinese-medicine-platform-backend \
  --desired-status RUNNING \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text)

if [ "$BACKEND_TASK" == "None" ] || [ -z "$BACKEND_TASK" ]; then
    echo -e "${RED}❌ No running backend tasks found${NC}"
    exit 1
fi

BACKEND_IP=$(aws ecs describe-tasks \
  --cluster chinese-medicine-platform-cluster \
  --tasks $BACKEND_TASK \
  --region us-east-1 \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text | xargs -I {} aws ec2 describe-network-interfaces \
  --network-interface-ids {} \
  --region us-east-1 \
  --query 'NetworkInterfaces[0].Association.PublicIp' \
  --output text)

if [ -z "$BACKEND_IP" ] || [ "$BACKEND_IP" == "None" ]; then
    echo -e "${RED}❌ Could not get backend IP address${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend IP: ${BACKEND_IP}${NC}"

# Test backend health first
echo -e "${YELLOW}🏥 Testing backend health...${NC}"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://${BACKEND_IP}:5001/health" || echo "000")

if [ "$HEALTH_CHECK" != "200" ]; then
    echo -e "${RED}❌ Backend health check failed (HTTP ${HEALTH_CHECK})${NC}"
    echo -e "${YELLOW}💡 Make sure your backend service is running${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend is healthy${NC}"

# Trigger database setup
echo -e "${YELLOW}🗄️  Initializing database...${NC}"
echo -e "${BLUE}This may take a few minutes...${NC}"

SETUP_RESPONSE=$(curl -s -X POST "http://${BACKEND_IP}:5001/api/setup" -w "\n%{http_code}")
HTTP_CODE=$(echo "$SETUP_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$SETUP_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
    echo -e "${GREEN}$RESPONSE_BODY${NC}"
    
    echo -e "${BLUE}=================================================${NC}"
    echo -e "${GREEN}🎉 Your Chinese Medicine Platform is ready!${NC}"
    echo -e "${BLUE}=================================================${NC}"
    
    echo -e "${BLUE}🌐 Access your application:${NC}"
    echo -e "${BLUE}   Frontend: http://54.211.42.43:3000${NC}"
    echo -e "${BLUE}   Backend API: http://${BACKEND_IP}:5001${NC}"
    
    echo -e "${BLUE}👤 Test Credentials:${NC}"
    echo -e "${BLUE}   Practitioner: practitioner@test.com / password123${NC}"
    echo -e "${BLUE}   Suppliers: supplier@test.com, dragonwell@test.com, etc. / password123${NC}"
    
    echo -e "${BLUE}🎯 Features ready:${NC}"
    echo -e "${BLUE}   ✅ 300+ Hong Kong approved herbs${NC}"
    echo -e "${BLUE}   ✅ 5 suppliers with realistic pricing${NC}"
    echo -e "${BLUE}   ✅ Bilingual herb search (English/Chinese)${NC}"
    echo -e "${BLUE}   ✅ Complete prescription workflow${NC}"
    echo -e "${BLUE}   ✅ Supplier comparison tools${NC}"
    
else
    echo -e "${RED}❌ Database setup failed (HTTP ${HTTP_CODE})${NC}"
    echo -e "${RED}Response: $RESPONSE_BODY${NC}"
    
    echo -e "${YELLOW}🔧 Troubleshooting:${NC}"
    echo -e "${YELLOW}   1. Check backend logs in CloudWatch${NC}"
    echo -e "${YELLOW}   2. Verify database connectivity${NC}"
    echo -e "${YELLOW}   3. Try running the setup again${NC}"
    exit 1
fi
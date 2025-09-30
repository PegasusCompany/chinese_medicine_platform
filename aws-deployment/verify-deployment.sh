#!/bin/bash

# Chinese Medicine Platform - Deployment Verification Script
# This script verifies that your deployment is working correctly

set -e

# Configuration
PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"  # Change this to match your deployment region

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Verifying Chinese Medicine Platform deployment${NC}"
echo -e "${BLUE}=================================================${NC}"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed.${NC}"
    exit 1
fi

# Get application URL
echo -e "${YELLOW}📋 Getting application details...${NC}"

APPLICATION_URL=$(aws cloudformation describe-stacks \
    --stack-name ${PROJECT_NAME}-services \
    --query 'Stacks[0].Outputs[?OutputKey==`ApplicationURL`].OutputValue' \
    --output text \
    --region ${REGION} 2>/dev/null)

if [ -z "$APPLICATION_URL" ] || [ "$APPLICATION_URL" == "None" ]; then
    echo -e "${RED}❌ Could not find application URL. Is the deployment complete?${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Application URL: ${APPLICATION_URL}${NC}"

# Test health endpoints
echo -e "${YELLOW}🏥 Testing health endpoints...${NC}"

# Test backend health
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${APPLICATION_URL}/health" || echo "000")
if [ "$BACKEND_HEALTH" == "200" ]; then
    echo -e "${GREEN}✅ Backend health check: OK${NC}"
else
    echo -e "${RED}❌ Backend health check failed (HTTP ${BACKEND_HEALTH})${NC}"
fi

# Test API health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${APPLICATION_URL}/api/health" || echo "000")
if [ "$API_HEALTH" == "200" ]; then
    echo -e "${GREEN}✅ API health check: OK${NC}"
else
    echo -e "${RED}❌ API health check failed (HTTP ${API_HEALTH})${NC}"
fi

# Test frontend
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${APPLICATION_URL}/" || echo "000")
if [ "$FRONTEND_HEALTH" == "200" ]; then
    echo -e "${GREEN}✅ Frontend health check: OK${NC}"
else
    echo -e "${RED}❌ Frontend health check failed (HTTP ${FRONTEND_HEALTH})${NC}"
fi

# Check ECS services
echo -e "${YELLOW}🐳 Checking ECS services...${NC}"

BACKEND_SERVICE=$(aws ecs describe-services \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-backend \
    --query 'services[0].status' \
    --output text \
    --region ${REGION} 2>/dev/null)

FRONTEND_SERVICE=$(aws ecs describe-services \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-frontend \
    --query 'services[0].status' \
    --output text \
    --region ${REGION} 2>/dev/null)

if [ "$BACKEND_SERVICE" == "ACTIVE" ]; then
    echo -e "${GREEN}✅ Backend service: ACTIVE${NC}"
else
    echo -e "${RED}❌ Backend service: ${BACKEND_SERVICE}${NC}"
fi

if [ "$FRONTEND_SERVICE" == "ACTIVE" ]; then
    echo -e "${GREEN}✅ Frontend service: ACTIVE${NC}"
else
    echo -e "${RED}❌ Frontend service: ${FRONTEND_SERVICE}${NC}"
fi

# Check RDS database
echo -e "${YELLOW}🗄️  Checking database...${NC}"

DB_STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text \
    --region ${REGION} 2>/dev/null)

if [ "$DB_STATUS" == "available" ]; then
    echo -e "${GREEN}✅ Database: Available${NC}"
else
    echo -e "${RED}❌ Database: ${DB_STATUS}${NC}"
fi

# Test API endpoints
echo -e "${YELLOW}🔌 Testing API endpoints...${NC}"

# Test herbs endpoint
HERBS_TEST=$(curl -s -o /dev/null -w "%{http_code}" "${APPLICATION_URL}/api/herbs" || echo "000")
if [ "$HERBS_TEST" == "200" ]; then
    echo -e "${GREEN}✅ Herbs API: OK${NC}"
else
    echo -e "${YELLOW}⚠️  Herbs API: HTTP ${HERBS_TEST} (may need authentication)${NC}"
fi

# Summary
echo -e "${BLUE}=================================================${NC}"
echo -e "${BLUE}📊 Deployment Verification Summary${NC}"
echo -e "${BLUE}=================================================${NC}"

if [ "$BACKEND_HEALTH" == "200" ] && [ "$API_HEALTH" == "200" ] && [ "$FRONTEND_HEALTH" == "200" ]; then
    echo -e "${GREEN}🎉 All health checks passed!${NC}"
    echo -e "${GREEN}🌐 Your application is ready for the hackathon!${NC}"
    echo -e "${GREEN}=================================================${NC}"
    echo -e "${GREEN}🔗 Application URL: ${APPLICATION_URL}${NC}"
    echo -e "${GREEN}=================================================${NC}"
    
    echo -e "${BLUE}📋 Test Credentials:${NC}"
    echo -e "${BLUE}   Practitioner: practitioner@test.com / password123${NC}"
    echo -e "${BLUE}   Suppliers: supplier@test.com, dragonwell@test.com, etc. / password123${NC}"
    
    echo -e "${BLUE}🎯 Features to showcase:${NC}"
    echo -e "${BLUE}   ✅ Bilingual herb search (English/Chinese)${NC}"
    echo -e "${BLUE}   ✅ Supplier comparison with realistic pricing${NC}"
    echo -e "${BLUE}   ✅ Complete prescription-to-order workflow${NC}"
    echo -e "${BLUE}   ✅ 23 demo prescriptions with TCM diagnoses${NC}"
    echo -e "${BLUE}   ✅ 10 suppliers with different strategies${NC}"
    echo -e "${BLUE}   ✅ 130+ Hong Kong approved herbs${NC}"
    
else
    echo -e "${RED}❌ Some health checks failed${NC}"
    echo -e "${YELLOW}🔧 Troubleshooting steps:${NC}"
    echo -e "${YELLOW}   1. Check CloudWatch logs for errors${NC}"
    echo -e "${YELLOW}   2. Verify ECS tasks are running${NC}"
    echo -e "${YELLOW}   3. Check security group rules${NC}"
    echo -e "${YELLOW}   4. Wait a few minutes for services to stabilize${NC}"
fi

echo -e "${BLUE}📊 Monitoring Links:${NC}"
echo -e "${BLUE}   CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups${NC}"
echo -e "${BLUE}   ECS Console: https://console.aws.amazon.com/ecs/home?region=${REGION}#/clusters/${PROJECT_NAME}-cluster${NC}"
echo -e "${BLUE}   RDS Console: https://console.aws.amazon.com/rds/home?region=${REGION}#databases:${NC}"
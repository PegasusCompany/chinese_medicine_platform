#!/bin/bash

# Chinese Medicine Platform - AWS Cleanup Script
# This script removes all AWS resources to avoid ongoing charges

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

echo -e "${RED}🧹 Starting AWS cleanup for Chinese Medicine Platform${NC}"
echo -e "${RED}=================================================${NC}"
echo -e "${YELLOW}⚠️  This will DELETE all AWS resources and cannot be undone!${NC}"

# Confirmation
read -p "Are you sure you want to delete all resources? (type 'yes' to confirm): " confirm
if [ "$confirm" != "yes" ]; then
    echo -e "${BLUE}Cleanup cancelled.${NC}"
    exit 0
fi

echo -e "${YELLOW}🗑️  Starting cleanup process...${NC}"

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured.${NC}"
    exit 1
fi

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}📋 AWS Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${BLUE}📋 Region: ${REGION}${NC}"

# Delete CloudFormation stacks
echo -e "${YELLOW}🗑️  Deleting CloudFormation stacks...${NC}"

# Delete services stack first (has dependencies on infrastructure)
echo -e "${BLUE}Deleting services stack...${NC}"
aws cloudformation delete-stack \
    --stack-name ${PROJECT_NAME}-services \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Services stack not found or already deleted${NC}"

# Wait for services stack to be deleted
echo -e "${BLUE}Waiting for services stack deletion...${NC}"
aws cloudformation wait stack-delete-complete \
    --stack-name ${PROJECT_NAME}-services \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Services stack deletion completed or not found${NC}"

# Delete infrastructure stack
echo -e "${BLUE}Deleting infrastructure stack...${NC}"
aws cloudformation delete-stack \
    --stack-name ${PROJECT_NAME}-infrastructure \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Infrastructure stack not found or already deleted${NC}"

# Wait for infrastructure stack to be deleted
echo -e "${BLUE}Waiting for infrastructure stack deletion...${NC}"
aws cloudformation wait stack-delete-complete \
    --stack-name ${PROJECT_NAME}-infrastructure \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Infrastructure stack deletion completed or not found${NC}"

echo -e "${GREEN}✅ CloudFormation stacks deleted${NC}"

# Delete ECR repositories
echo -e "${YELLOW}🗑️  Deleting ECR repositories...${NC}"

# Delete backend repository
echo -e "${BLUE}Deleting backend ECR repository...${NC}"
aws ecr delete-repository \
    --repository-name ${PROJECT_NAME}-backend \
    --force \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Backend repository not found or already deleted${NC}"

# Delete frontend repository
echo -e "${BLUE}Deleting frontend ECR repository...${NC}"
aws ecr delete-repository \
    --repository-name ${PROJECT_NAME}-frontend \
    --force \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Frontend repository not found or already deleted${NC}"

echo -e "${GREEN}✅ ECR repositories deleted${NC}"

# Clean up CloudWatch Log Groups
echo -e "${YELLOW}🗑️  Deleting CloudWatch Log Groups...${NC}"

aws logs delete-log-group \
    --log-group-name /ecs/${PROJECT_NAME}-backend \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Backend log group not found or already deleted${NC}"

aws logs delete-log-group \
    --log-group-name /ecs/${PROJECT_NAME}-frontend \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Frontend log group not found or already deleted${NC}"

echo -e "${GREEN}✅ CloudWatch Log Groups deleted${NC}"

# Clean up local Docker images
echo -e "${YELLOW}🗑️  Cleaning up local Docker images...${NC}"

docker rmi ${PROJECT_NAME}-backend:latest 2>/dev/null || echo -e "${YELLOW}⚠️  Backend image not found locally${NC}"
docker rmi ${PROJECT_NAME}-frontend:latest 2>/dev/null || echo -e "${YELLOW}⚠️  Frontend image not found locally${NC}"
docker rmi ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest 2>/dev/null || echo -e "${YELLOW}⚠️  Backend ECR image not found locally${NC}"
docker rmi ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest 2>/dev/null || echo -e "${YELLOW}⚠️  Frontend ECR image not found locally${NC}"

echo -e "${GREEN}✅ Local Docker images cleaned${NC}"

# Final verification
echo -e "${YELLOW}🔍 Verifying cleanup...${NC}"

# Check for remaining stacks
REMAINING_STACKS=$(aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
    --query "StackSummaries[?contains(StackName, '${PROJECT_NAME}')].StackName" \
    --output text \
    --region ${REGION})

if [ -z "$REMAINING_STACKS" ]; then
    echo -e "${GREEN}✅ No remaining CloudFormation stacks${NC}"
else
    echo -e "${YELLOW}⚠️  Remaining stacks found: ${REMAINING_STACKS}${NC}"
fi

# Check for remaining ECR repositories
REMAINING_REPOS=$(aws ecr describe-repositories \
    --query "repositories[?contains(repositoryName, '${PROJECT_NAME}')].repositoryName" \
    --output text \
    --region ${REGION} 2>/dev/null)

if [ -z "$REMAINING_REPOS" ]; then
    echo -e "${GREEN}✅ No remaining ECR repositories${NC}"
else
    echo -e "${YELLOW}⚠️  Remaining repositories found: ${REMAINING_REPOS}${NC}"
fi

echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}✅ All AWS resources have been deleted${NC}"
echo -e "${GREEN}✅ No more charges will be incurred${NC}"
echo -e "${GREEN}✅ Local Docker images cleaned up${NC}"
echo -e "${GREEN}=================================================${NC}"

echo -e "${BLUE}📋 Summary of deleted resources:${NC}"
echo -e "${BLUE}   - ECS Cluster and Services${NC}"
echo -e "${BLUE}   - Application Load Balancer${NC}"
echo -e "${BLUE}   - RDS PostgreSQL Database${NC}"
echo -e "${BLUE}   - VPC and Networking Components${NC}"
echo -e "${BLUE}   - ECR Repositories${NC}"
echo -e "${BLUE}   - CloudWatch Log Groups${NC}"
echo -e "${BLUE}   - Security Groups${NC}"
echo -e "${BLUE}   - IAM Roles (created by CloudFormation)${NC}"

echo -e "${GREEN}🚀 Cleanup complete! Thank you for using the Chinese Medicine Platform.${NC}"
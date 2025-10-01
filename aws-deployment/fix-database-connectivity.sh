#!/bin/bash

# Chinese Medicine Platform - Fix Database Connectivity
# This script fixes the database connectivity issue between ECS tasks and RDS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing Database Connectivity${NC}"
echo -e "${BLUE}================================${NC}"

REGION="us-east-1"

# Get the VPC ID (use the first VPC found)
VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text --region ${REGION})

if [ "$VPC_ID" == "None" ] || [ -z "$VPC_ID" ]; then
    echo -e "${RED}❌ Could not find VPC${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found VPC: ${VPC_ID}${NC}"

# Get the RDS database security groups
RDS_SG_ID=$(aws rds describe-db-instances --db-instance-identifier chinese-medicine-platform-db --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text --region ${REGION})

if [ "$RDS_SG_ID" == "None" ] || [ -z "$RDS_SG_ID" ]; then
    echo -e "${RED}❌ Could not find RDS security group${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found RDS Security Group: ${RDS_SG_ID}${NC}"

# Get the ECS security group ID (look for chinese-medicine-platform-sg)
ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=chinese-medicine-platform-sg" --query 'SecurityGroups[0].GroupId' --output text --region ${REGION})

if [ "$ECS_SG_ID" == "None" ] || [ -z "$ECS_SG_ID" ]; then
    echo -e "${YELLOW}⚠️  Could not find ECS security group, using VPC CIDR instead${NC}"
    ECS_SG_ID=""
fi

echo -e "${GREEN}✅ Found ECS Security Group: ${ECS_SG_ID}${NC}"

# Get VPC CIDR block
VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids ${VPC_ID} --query 'Vpcs[0].CidrBlock' --output text --region ${REGION})
echo -e "${GREEN}✅ VPC CIDR: ${VPC_CIDR}${NC}"

# Add rule to allow access from the entire VPC CIDR
echo -e "${YELLOW}🔧 Adding security group rule to allow database access from VPC...${NC}"

aws ec2 authorize-security-group-ingress \
    --group-id ${RDS_SG_ID} \
    --protocol tcp \
    --port 5432 \
    --cidr ${VPC_CIDR} \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Rule may already exist${NC}"

echo -e "${GREEN}✅ VPC-wide access rule added${NC}"

# If we found an ECS security group, add that rule too
if [ ! -z "$ECS_SG_ID" ]; then
    echo -e "${YELLOW}🔧 Adding ECS security group rule...${NC}"
    aws ec2 authorize-security-group-ingress \
        --group-id ${RDS_SG_ID} \
        --protocol tcp \
        --port 5432 \
        --source-group ${ECS_SG_ID} \
        --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Rule may already exist${NC}"
    echo -e "${GREEN}✅ ECS to RDS rule added${NC}"
fi

# Check current security group rules
echo -e "${YELLOW}📋 Current RDS security group rules:${NC}"
aws ec2 describe-security-groups \
    --group-ids ${RDS_SG_ID} \
    --query 'SecurityGroups[0].IpPermissions[*].{Protocol:IpProtocol,Port:FromPort,Source:IpRanges[0].CidrIp,SourceSG:UserIdGroupPairs[0].GroupId}' \
    --output table \
    --region ${REGION}

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}🎉 Database connectivity fix applied!${NC}"
echo -e "${BLUE}================================${NC}"

echo -e "${YELLOW}💡 Now try running the database setup again:${NC}"
echo -e "${BLUE}   aws ecs execute-command \\${NC}"
echo -e "${BLUE}     --cluster chinese-medicine-platform-cluster \\${NC}"
echo -e "${BLUE}     --task [YOUR-TASK-ID] \\${NC}"
echo -e "${BLUE}     --container backend \\${NC}"
echo -e "${BLUE}     --interactive \\${NC}"
echo -e "${BLUE}     --command \"npm run setup\"${NC}"

echo -e "${YELLOW}🔍 Or test the connection first:${NC}"
echo -e "${BLUE}   aws ecs execute-command \\${NC}"
echo -e "${BLUE}     --cluster chinese-medicine-platform-cluster \\${NC}"
echo -e "${BLUE}     --task [YOUR-TASK-ID] \\${NC}"
echo -e "${BLUE}     --container backend \\${NC}"
echo -e "${BLUE}     --interactive \\${NC}"
echo -e "${BLUE}     --command \"npm run migrate\"${NC}"
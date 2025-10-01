#!/bin/bash

# Chinese Medicine Platform - Fix RDS SSL Configuration
# This script modifies RDS to allow non-SSL connections

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Fixing RDS SSL Configuration${NC}"
echo -e "${BLUE}===============================${NC}"

PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"
DB_INSTANCE_ID="${PROJECT_NAME}-db"
PARAM_GROUP_NAME="${PROJECT_NAME}-pg"

# Create a custom parameter group
echo -e "${YELLOW}📋 Creating custom parameter group...${NC}"
aws rds create-db-parameter-group \
    --db-parameter-group-name ${PARAM_GROUP_NAME} \
    --db-parameter-group-family postgres17 \
    --description "Custom parameter group for Chinese Medicine Platform" \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Parameter group may already exist${NC}"

# Modify the parameter group to allow non-SSL connections
echo -e "${YELLOW}🔧 Modifying SSL settings in parameter group...${NC}"
aws rds modify-db-parameter-group \
    --db-parameter-group-name ${PARAM_GROUP_NAME} \
    --parameters "ParameterName=rds.force_ssl,ParameterValue=0,ApplyMethod=immediate" \
    --region ${REGION}

echo -e "${GREEN}✅ Parameter group configured${NC}"

# Apply the parameter group to the database
echo -e "${YELLOW}🔄 Applying parameter group to database...${NC}"
aws rds modify-db-instance \
    --db-instance-identifier ${DB_INSTANCE_ID} \
    --db-parameter-group-name ${PARAM_GROUP_NAME} \
    --apply-immediately \
    --region ${REGION}

echo -e "${GREEN}✅ Parameter group applied to database${NC}"

# Wait for the modification to complete
echo -e "${YELLOW}⏳ Waiting for database modification to complete...${NC}"
echo -e "${YELLOW}This may take several minutes...${NC}"

aws rds wait db-instance-available \
    --db-instance-identifier ${DB_INSTANCE_ID} \
    --region ${REGION}

echo -e "${GREEN}✅ Database modification completed${NC}"

echo -e "${BLUE}===============================${NC}"
echo -e "${GREEN}🎉 RDS SSL configuration updated!${NC}"
echo -e "${BLUE}===============================${NC}"

echo -e "${YELLOW}💡 Now try the database setup again:${NC}"
echo -e "${BLUE}   aws ecs execute-command \\${NC}"
echo -e "${BLUE}     --cluster ${PROJECT_NAME}-cluster \\${NC}"
echo -e "${BLUE}     --task [TASK-ID] \\${NC}"
echo -e "${BLUE}     --container backend \\${NC}"
echo -e "${BLUE}     --interactive \\${NC}"
echo -e "${BLUE}     --command \"npm run setup\"${NC}"
#!/bin/bash

# Chinese Medicine Platform - AWS Deployment Script (Improved)
# This script deploys the application to AWS with all debugging fixes included

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

echo -e "${BLUE}🚀 Starting AWS deployment for Chinese Medicine Platform (Improved)${NC}"
echo -e "${BLUE}================================================================${NC}"

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

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}📋 AWS Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${BLUE}📋 Region: ${REGION}${NC}"
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
docker build --platform linux/amd64 -f Dockerfile.prod -t ${PROJECT_NAME}-backend .
docker tag ${PROJECT_NAME}-backend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest

BACKEND_IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest"
echo -e "${GREEN}✅ Backend image pushed: ${BACKEND_IMAGE_URI}${NC}"

# Frontend (placeholder build - will rebuild with correct API URL later)
echo -e "${BLUE}Building frontend image (initial)...${NC}"
cd ../frontend
# Use placeholder for now - we'll rebuild with correct backend IP after deployment
REACT_APP_API_URL="http://PLACEHOLDER_BACKEND_IP:5000"
docker build --platform linux/amd64 -f Dockerfile.prod --build-arg REACT_APP_API_URL=${REACT_APP_API_URL} -t ${PROJECT_NAME}-frontend .
docker tag ${PROJECT_NAME}-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest

FRONTEND_IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest"
echo -e "${GREEN}✅ Frontend image pushed (will rebuild with correct API URL): ${FRONTEND_IMAGE_URI}${NC}"

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

# Comprehensive Database Setup with all fixes
echo -e "${YELLOW}🗄️  Setting up database with all fixes...${NC}"

# Step 1: Fix RDS SSL configuration
echo -e "${BLUE}Step 1: Configuring RDS SSL settings...${NC}"
PARAM_GROUP_NAME="${PROJECT_NAME}-pg"

# Create custom parameter group
aws rds create-db-parameter-group \
    --db-parameter-group-name ${PARAM_GROUP_NAME} \
    --db-parameter-group-family postgres15 \
    --description "Custom parameter group for Chinese Medicine Platform" \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Parameter group may already exist${NC}"

# Configure SSL settings
aws rds modify-db-parameter-group \
    --db-parameter-group-name ${PARAM_GROUP_NAME} \
    --parameters "ParameterName=rds.force_ssl,ParameterValue=0,ApplyMethod=immediate" \
    --region ${REGION}

# Apply parameter group to database
aws rds modify-db-instance \
    --db-instance-identifier ${PROJECT_NAME}-db \
    --db-parameter-group-name ${PARAM_GROUP_NAME} \
    --apply-immediately \
    --region ${REGION}

# Reboot database to apply changes
echo -e "${BLUE}Rebooting database to apply SSL changes...${NC}"
aws rds reboot-db-instance --db-instance-identifier ${PROJECT_NAME}-db --region ${REGION}
aws rds wait db-instance-available --db-instance-identifier ${PROJECT_NAME}-db --region ${REGION}

echo -e "${GREEN}✅ Database SSL configuration completed${NC}"

# Step 2: Fix security groups for database connectivity
echo -e "${BLUE}Step 2: Configuring security groups...${NC}"
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=${PROJECT_NAME}-vpc" --query 'Vpcs[0].VpcId' --output text --region ${REGION} 2>/dev/null || aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text --region ${REGION})
RDS_SG_ID=$(aws rds describe-db-instances --db-instance-identifier ${PROJECT_NAME}-db --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text --region ${REGION})
ECS_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-ecs-sg" --query 'SecurityGroups[0].GroupId' --output text --region ${REGION} 2>/dev/null || aws ec2 describe-security-groups --filters "Name=group-name,Values=${PROJECT_NAME}-sg" --query 'SecurityGroups[0].GroupId' --output text --region ${REGION})
VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids ${VPC_ID} --query 'Vpcs[0].CidrBlock' --output text --region ${REGION})

# Add security group rules
aws ec2 authorize-security-group-ingress \
    --group-id ${RDS_SG_ID} \
    --protocol tcp \
    --port 5432 \
    --cidr ${VPC_CIDR} \
    --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  VPC rule may already exist${NC}"

if [ ! -z "$ECS_SG_ID" ] && [ "$ECS_SG_ID" != "None" ]; then
    aws ec2 authorize-security-group-ingress \
        --group-id ${RDS_SG_ID} \
        --protocol tcp \
        --port 5432 \
        --source-group ${ECS_SG_ID} \
        --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  ECS rule may already exist${NC}"
fi

echo -e "${GREEN}✅ Security groups configured${NC}"

# Step 3: Get backend task and run comprehensive setup
echo -e "${BLUE}Step 3: Running comprehensive database setup...${NC}"
BACKEND_TASK_ARN=$(aws ecs list-tasks \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name ${PROJECT_NAME}-backend \
    --query 'taskArns[0]' \
    --output text \
    --region ${REGION})

if [ "$BACKEND_TASK_ARN" != "None" ] && [ "$BACKEND_TASK_ARN" != "" ]; then
    TASK_ID=$(echo $BACKEND_TASK_ARN | cut -d'/' -f3)
    echo -e "${BLUE}Using backend task: ${TASK_ID}${NC}"
    
    # Fix database schema first
    echo -e "${BLUE}Adding missing database columns...${NC}"
    aws ecs execute-command \
        --cluster ${PROJECT_NAME}-cluster \
        --task ${TASK_ID} \
        --container backend \
        --interactive \
        --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_dob DATE').then(() => console.log('✅ patient_dob added')).catch(e => console.log('⚠️ ', e.message))\"" \
        --region ${REGION} || echo -e "${YELLOW}⚠️  Column addition may have failed${NC}"
    
    aws ecs execute-command \
        --cluster ${PROJECT_NAME}-cluster \
        --task ${TASK_ID} \
        --container backend \
        --interactive \
        --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS symptoms TEXT').then(() => console.log('✅ symptoms added')).catch(e => console.log('⚠️ ', e.message))\"" \
        --region ${REGION} || echo -e "${YELLOW}⚠️  Column addition may have failed${NC}"
    
    aws ecs execute-command \
        --cluster ${PROJECT_NAME}-cluster \
        --task ${TASK_ID} \
        --container backend \
        --interactive \
        --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT').then(() => console.log('✅ diagnosis added')).catch(e => console.log('⚠️ ', e.message))\"" \
        --region ${REGION} || echo -e "${YELLOW}⚠️  Column addition may have failed${NC}"
    
    aws ecs execute-command \
        --cluster ${PROJECT_NAME}-cluster \
        --task ${TASK_ID} \
        --container backend \
        --interactive \
        --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ALTER COLUMN status TYPE VARCHAR(50)').then(() => console.log('✅ Status column expanded')).catch(e => console.log('⚠️ ', e.message))\"" \
        --region ${REGION} || echo -e "${YELLOW}⚠️  Column expansion may have failed${NC}"
    
    # Run main database setup
    echo -e "${BLUE}Running main database setup...${NC}"
    aws ecs execute-command \
        --cluster ${PROJECT_NAME}-cluster \
        --task ${TASK_ID} \
        --container backend \
        --interactive \
        --command "npm run setup" \
        --region ${REGION} || echo -e "${YELLOW}⚠️  Main setup may have failed${NC}"
    
    # Create demo data
    echo -e "${BLUE}Creating demo data...${NC}"
    aws ecs execute-command \
        --cluster ${PROJECT_NAME}-cluster \
        --task ${TASK_ID} \
        --container backend \
        --interactive \
        --command "npm run demo-data" \
        --region ${REGION} || echo -e "${YELLOW}⚠️  Demo data creation may have failed${NC}"
    
    echo -e "${GREEN}✅ Database setup completed${NC}"
else
    echo -e "${YELLOW}⚠️  Could not find backend task, you'll need to initialize the database manually${NC}"
fi

# Step 4: Rebuild frontend with correct backend IP
echo -e "${BLUE}Step 4: Rebuilding frontend with correct backend IP...${NC}"
if [ "$BACKEND_TASK_ARN" != "None" ] && [ "$BACKEND_TASK_ARN" != "" ]; then
    TASK_ID=$(echo $BACKEND_TASK_ARN | cut -d'/' -f3)
    BACKEND_IP=$(aws ecs describe-tasks \
        --cluster ${PROJECT_NAME}-cluster \
        --tasks ${TASK_ID} \
        --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
        --output text \
        --region ${REGION} | xargs -I {} aws ec2 describe-network-interfaces \
        --network-interface-ids {} \
        --query 'NetworkInterfaces[0].Association.PublicIp' \
        --output text \
        --region ${REGION})
    
    if [ ! -z "$BACKEND_IP" ] && [ "$BACKEND_IP" != "None" ]; then
        echo -e "${BLUE}Backend IP: ${BACKEND_IP}${NC}"
        
        # Rebuild frontend with correct API URL
        cd ../frontend
        docker build --platform linux/amd64 -f Dockerfile.prod --build-arg REACT_APP_API_URL=http://${BACKEND_IP}:5000 -t ${PROJECT_NAME}-frontend .
        docker tag ${PROJECT_NAME}-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
        docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
        
        # Force frontend service update
        aws ecs update-service \
            --cluster ${PROJECT_NAME}-cluster \
            --service ${PROJECT_NAME}-frontend \
            --force-new-deployment \
            --region ${REGION}
        
        # Wait for frontend to be stable
        echo -e "${BLUE}Waiting for frontend deployment...${NC}"
        aws ecs wait services-stable \
            --cluster ${PROJECT_NAME}-cluster \
            --services ${PROJECT_NAME}-frontend \
            --region ${REGION}
        
        # Get final frontend IP
        FRONTEND_TASK_ARN=$(aws ecs list-tasks \
            --cluster ${PROJECT_NAME}-cluster \
            --service-name ${PROJECT_NAME}-frontend \
            --query 'taskArns[0]' \
            --output text \
            --region ${REGION})
        
        if [ "$FRONTEND_TASK_ARN" != "None" ] && [ "$FRONTEND_TASK_ARN" != "" ]; then
            FRONTEND_TASK_ID=$(echo $FRONTEND_TASK_ARN | cut -d'/' -f3)
            FRONTEND_IP=$(aws ecs describe-tasks \
                --cluster ${PROJECT_NAME}-cluster \
                --tasks ${FRONTEND_TASK_ID} \
                --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
                --output text \
                --region ${REGION} | xargs -I {} aws ec2 describe-network-interfaces \
                --network-interface-ids {} \
                --query 'NetworkInterfaces[0].Association.PublicIp' \
                --output text \
                --region ${REGION})
            
            APPLICATION_URL="http://${FRONTEND_IP}"
        fi
        
        cd ../aws-deployment
        echo -e "${GREEN}✅ Frontend rebuilt with correct API URL${NC}"
    fi
fi

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}================================================================${NC}"
echo -e "${GREEN}🌐 Application URL: ${APPLICATION_URL}${NC}"
echo -e "${GREEN}🔗 Backend API: http://${BACKEND_IP}:5000${NC}"
echo -e "${GREEN}📊 CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=${REGION}#logsV2:log-groups${NC}"
echo -e "${GREEN}🐳 ECS Console: https://console.aws.amazon.com/ecs/home?region=${REGION}#/clusters/${PROJECT_NAME}-cluster${NC}"
echo -e "${GREEN}================================================================${NC}"

echo -e "${BLUE}📋 Test Credentials:${NC}"
echo -e "${BLUE}   Practitioner: practitioner@test.com / password123${NC}"
echo -e "${BLUE}   Suppliers: supplier@test.com, dragonwell@test.com, etc. / password123${NC}"

echo -e "${YELLOW}⚠️  Note: If the database setup failed, you can run it manually:${NC}"
echo -e "${YELLOW}   1. Go to ECS Console${NC}"
echo -e "${YELLOW}   2. Find the backend task${NC}"
echo -e "${YELLOW}   3. Execute command: npm run setup${NC}"

echo -e "${GREEN}🚀 Your Chinese Medicine Platform is now live on AWS!${NC}"
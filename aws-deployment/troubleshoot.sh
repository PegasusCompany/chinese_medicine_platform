#!/bin/bash

# Chinese Medicine Platform - Comprehensive Troubleshooting Script
# This script diagnoses and fixes common deployment issues

set -e

# Configuration
PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Chinese Medicine Platform - Troubleshooting${NC}"
echo -e "${BLUE}===============================================${NC}"

# Function to check service status
check_service_status() {
    echo -e "${YELLOW}📋 Checking service status...${NC}"
    aws ecs describe-services \
        --cluster ${PROJECT_NAME}-cluster \
        --services ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend \
        --query 'services[*].{Service:serviceName,Status:status,Running:runningCount,Desired:desiredCount,TaskDefinition:taskDefinition}' \
        --output table \
        --region ${REGION}
}

# Function to get task IPs
get_task_ips() {
    echo -e "${YELLOW}🌐 Getting task IP addresses...${NC}"
    
    BACKEND_TASK=$(aws ecs list-tasks --cluster ${PROJECT_NAME}-cluster --service-name ${PROJECT_NAME}-backend --desired-status RUNNING --query 'taskArns[0]' --output text --region ${REGION})
    FRONTEND_TASK=$(aws ecs list-tasks --cluster ${PROJECT_NAME}-cluster --service-name ${PROJECT_NAME}-frontend --desired-status RUNNING --query 'taskArns[0]' --output text --region ${REGION})
    
    if [ "$BACKEND_TASK" != "None" ] && [ "$BACKEND_TASK" != "" ]; then
        BACKEND_IP=$(aws ecs describe-tasks --cluster ${PROJECT_NAME}-cluster --tasks ${BACKEND_TASK} --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text --region ${REGION} | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region ${REGION})
        echo -e "${GREEN}Backend IP: ${BACKEND_IP}${NC}"
    else
        echo -e "${RED}❌ No backend task found${NC}"
    fi
    
    if [ "$FRONTEND_TASK" != "None" ] && [ "$FRONTEND_TASK" != "" ]; then
        FRONTEND_IP=$(aws ecs describe-tasks --cluster ${PROJECT_NAME}-cluster --tasks ${FRONTEND_TASK} --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' --output text --region ${REGION} | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text --region ${REGION})
        echo -e "${GREEN}Frontend IP: ${FRONTEND_IP}${NC}"
    else
        echo -e "${RED}❌ No frontend task found${NC}"
    fi
}

# Function to test connectivity
test_connectivity() {
    echo -e "${YELLOW}🔌 Testing connectivity...${NC}"
    
    if [ ! -z "$BACKEND_IP" ]; then
        BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://${BACKEND_IP}:5000/health" || echo "000")
        if [ "$BACKEND_HEALTH" == "200" ]; then
            echo -e "${GREEN}✅ Backend health check: OK${NC}"
        else
            echo -e "${RED}❌ Backend health check failed (HTTP ${BACKEND_HEALTH})${NC}"
        fi
    fi
    
    if [ ! -z "$FRONTEND_IP" ]; then
        FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "http://${FRONTEND_IP}" || echo "000")
        if [ "$FRONTEND_HEALTH" == "200" ]; then
            echo -e "${GREEN}✅ Frontend health check: OK${NC}"
        else
            echo -e "${RED}❌ Frontend health check failed (HTTP ${FRONTEND_HEALTH})${NC}"
        fi
    fi
}

# Function to check database connectivity
check_database() {
    echo -e "${YELLOW}🗄️  Checking database connectivity...${NC}"
    
    DB_STATUS=$(aws rds describe-db-instances --db-instance-identifier ${PROJECT_NAME}-db --query 'DBInstances[0].DBInstanceStatus' --output text --region ${REGION} 2>/dev/null)
    if [ "$DB_STATUS" == "available" ]; then
        echo -e "${GREEN}✅ Database status: Available${NC}"
    else
        echo -e "${RED}❌ Database status: ${DB_STATUS}${NC}"
    fi
    
    # Test database connection from backend
    if [ ! -z "$BACKEND_TASK" ] && [ "$BACKEND_TASK" != "None" ]; then
        TASK_ID=$(echo $BACKEND_TASK | cut -d'/' -f3)
        echo -e "${BLUE}Testing database connection from backend...${NC}"
        aws ecs execute-command \
            --cluster ${PROJECT_NAME}-cluster \
            --task ${TASK_ID} \
            --container backend \
            --interactive \
            --command "node -e \"require('./config/database').query('SELECT NOW()').then(r => console.log('✅ DB connected:', r.rows[0])).catch(e => console.log('❌ DB error:', e.message))\"" \
            --region ${REGION} || echo -e "${RED}❌ Database connection test failed${NC}"
    fi
}

# Function to fix common issues
fix_issues() {
    echo -e "${YELLOW}🔧 Applying common fixes...${NC}"
    
    # Fix 1: Database connectivity
    echo -e "${BLUE}Fix 1: Database connectivity...${NC}"
    VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text --region ${REGION})
    RDS_SG_ID=$(aws rds describe-db-instances --db-instance-identifier ${PROJECT_NAME}-db --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' --output text --region ${REGION} 2>/dev/null)
    VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids ${VPC_ID} --query 'Vpcs[0].CidrBlock' --output text --region ${REGION})
    
    if [ ! -z "$RDS_SG_ID" ] && [ "$RDS_SG_ID" != "None" ]; then
        aws ec2 authorize-security-group-ingress \
            --group-id ${RDS_SG_ID} \
            --protocol tcp \
            --port 5432 \
            --cidr ${VPC_CIDR} \
            --region ${REGION} 2>/dev/null || echo -e "${YELLOW}⚠️  Security group rule may already exist${NC}"
        echo -e "${GREEN}✅ Database security group updated${NC}"
    fi
    
    # Fix 2: Database schema
    if [ ! -z "$BACKEND_TASK" ] && [ "$BACKEND_TASK" != "None" ]; then
        TASK_ID=$(echo $BACKEND_TASK | cut -d'/' -f3)
        echo -e "${BLUE}Fix 2: Database schema...${NC}"
        
        aws ecs execute-command \
            --cluster ${PROJECT_NAME}-cluster \
            --task ${TASK_ID} \
            --container backend \
            --interactive \
            --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_dob DATE, ADD COLUMN IF NOT EXISTS symptoms TEXT, ADD COLUMN IF NOT EXISTS diagnosis TEXT').then(() => console.log('✅ Schema updated')).catch(e => console.log('⚠️ ', e.message))\"" \
            --region ${REGION} || echo -e "${YELLOW}⚠️  Schema update may have failed${NC}"
        
        aws ecs execute-command \
            --cluster ${PROJECT_NAME}-cluster \
            --task ${TASK_ID} \
            --container backend \
            --interactive \
            --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ALTER COLUMN status TYPE VARCHAR(50)').then(() => console.log('✅ Status column expanded')).catch(e => console.log('⚠️ ', e.message))\"" \
            --region ${REGION} || echo -e "${YELLOW}⚠️  Column expansion may have failed${NC}"
        
        echo -e "${GREEN}✅ Database schema fixes applied${NC}"
    fi
    
    # Fix 3: Frontend API URL
    if [ ! -z "$BACKEND_IP" ] && [ ! -z "$FRONTEND_TASK" ]; then
        echo -e "${BLUE}Fix 3: Rebuilding frontend with correct API URL...${NC}"
        
        cd ../frontend
        docker build --platform linux/amd64 -f Dockerfile.prod --build-arg REACT_APP_API_URL=http://${BACKEND_IP}:5000 -t ${PROJECT_NAME}-frontend .
        
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        docker tag ${PROJECT_NAME}-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
        
        aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
        docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest
        
        aws ecs update-service \
            --cluster ${PROJECT_NAME}-cluster \
            --service ${PROJECT_NAME}-frontend \
            --force-new-deployment \
            --region ${REGION}
        
        cd ../aws-deployment
        echo -e "${GREEN}✅ Frontend rebuilt and redeployed${NC}"
    fi
}

# Function to show logs
show_logs() {
    echo -e "${YELLOW}📋 Recent logs...${NC}"
    
    echo -e "${BLUE}Backend logs (last 10 lines):${NC}"
    aws logs tail /ecs/${PROJECT_NAME}-backend --since 10m --region ${REGION} | tail -10 || echo -e "${YELLOW}⚠️  No backend logs found${NC}"
    
    echo -e "${BLUE}Frontend logs (last 10 lines):${NC}"
    aws logs tail /ecs/${PROJECT_NAME}-frontend --since 10m --region ${REGION} | tail -10 || echo -e "${YELLOW}⚠️  No frontend logs found${NC}"
}

# Main menu
echo -e "${BLUE}Select troubleshooting option:${NC}"
echo -e "${BLUE}1. Check service status${NC}"
echo -e "${BLUE}2. Get task IP addresses${NC}"
echo -e "${BLUE}3. Test connectivity${NC}"
echo -e "${BLUE}4. Check database${NC}"
echo -e "${BLUE}5. Apply common fixes${NC}"
echo -e "${BLUE}6. Show recent logs${NC}"
echo -e "${BLUE}7. Run all checks${NC}"
echo -e "${BLUE}8. Exit${NC}"

read -p "Enter your choice (1-8): " choice

case $choice in
    1) check_service_status ;;
    2) get_task_ips ;;
    3) get_task_ips && test_connectivity ;;
    4) check_database ;;
    5) get_task_ips && fix_issues ;;
    6) show_logs ;;
    7) 
        check_service_status
        get_task_ips
        test_connectivity
        check_database
        show_logs
        ;;
    8) echo -e "${GREEN}Goodbye!${NC}" && exit 0 ;;
    *) echo -e "${RED}Invalid choice${NC}" && exit 1 ;;
esac

echo -e "${GREEN}🎉 Troubleshooting completed!${NC}"
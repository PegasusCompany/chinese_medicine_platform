#!/bin/bash

# Create ECS Task Definitions and Services
set -e

PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"
ACCOUNT_ID="975049890307"
DATABASE_URL="postgresql://postgres:ChineseMedicine2024!@chinese-medicine-platform-db.c3s66u28cz4z.us-east-1.rds.amazonaws.com:5432/chinese_medicine_db"
JWT_SECRET="your-super-secret-jwt-key-for-hackathon-2024-$(date +%s)"

echo "🚀 Creating ECS Task Definitions and Services..."

# Create Backend Task Definition
cat > backend-task-def.json << EOF
{
  "family": "${PROJECT_NAME}-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "5000"
        },
        {
          "name": "DATABASE_URL",
          "value": "${DATABASE_URL}"
        },
        {
          "name": "JWT_SECRET",
          "value": "${JWT_SECRET}"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}-backend",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Create Frontend Task Definition
cat > frontend-task-def.json << EOF
{
  "family": "${PROJECT_NAME}-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::${ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${PROJECT_NAME}-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}-frontend",
          "awslogs-region": "${REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

# Create CloudWatch Log Groups
aws logs create-log-group --log-group-name "/ecs/${PROJECT_NAME}-backend" --region ${REGION} 2>/dev/null || echo "Backend log group may already exist"
aws logs create-log-group --log-group-name "/ecs/${PROJECT_NAME}-frontend" --region ${REGION} 2>/dev/null || echo "Frontend log group may already exist"

# Register Task Definitions
echo "📋 Registering backend task definition..."
aws ecs register-task-definition --cli-input-json file://backend-task-def.json --region ${REGION}

echo "📋 Registering frontend task definition..."
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json --region ${REGION}

# Get default VPC and subnets
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region ${REGION})
SUBNET_IDS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=${VPC_ID}" --query 'Subnets[0:2].SubnetId' --output text --region ${REGION})
SUBNET_1=$(echo $SUBNET_IDS | cut -d' ' -f1)
SUBNET_2=$(echo $SUBNET_IDS | cut -d' ' -f2)

# Create Security Group
SECURITY_GROUP_ID=$(aws ec2 create-security-group \
    --group-name ${PROJECT_NAME}-sg \
    --description "Security group for Chinese Medicine Platform" \
    --vpc-id ${VPC_ID} \
    --query 'GroupId' \
    --output text \
    --region ${REGION} 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-sg" \
    --query 'SecurityGroups[0].GroupId' \
    --output text \
    --region ${REGION})

# Add security group rules
aws ec2 authorize-security-group-ingress \
    --group-id ${SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0 \
    --region ${REGION} 2>/dev/null || echo "Port 80 rule may already exist"

aws ec2 authorize-security-group-ingress \
    --group-id ${SECURITY_GROUP_ID} \
    --protocol tcp \
    --port 5000 \
    --cidr 0.0.0.0/0 \
    --region ${REGION} 2>/dev/null || echo "Port 5000 rule may already exist"

# Create ECS Services
echo "🚀 Creating backend service..."
aws ecs create-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name ${PROJECT_NAME}-backend \
    --task-definition ${PROJECT_NAME}-backend \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_1},${SUBNET_2}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
    --region ${REGION}

echo "🚀 Creating frontend service..."
aws ecs create-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name ${PROJECT_NAME}-frontend \
    --task-definition ${PROJECT_NAME}-frontend \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_1},${SUBNET_2}],securityGroups=[${SECURITY_GROUP_ID}],assignPublicIp=ENABLED}" \
    --region ${REGION}

echo "✅ ECS Services created!"
echo "🔍 Check your services at: https://console.aws.amazon.com/ecs/home?region=${REGION}#/clusters/${PROJECT_NAME}-cluster"

# Clean up temp files
rm -f backend-task-def.json frontend-task-def.json

echo "🎉 Deployment complete! Your Chinese Medicine Platform is now running on AWS!"
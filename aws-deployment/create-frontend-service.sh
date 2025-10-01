#!/bin/bash

echo "🚀 Creating frontend service..."

# Create frontend service
aws ecs create-service \
  --cluster chinese-medicine-platform-cluster \
  --service-name chinese-medicine-platform-frontend \
  --task-definition chinese-medicine-platform-frontend:2 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-0adc0477c1606c638,subnet-01a2abd11ae7196d9],securityGroups=[sg-0b608e7aac9c6dcf9],assignPublicIp=ENABLED}" \
  --region us-east-1

echo "✅ Frontend service created"

echo "📊 Checking service status..."

# Check backend service status
echo "Backend service status:"
aws ecs describe-services \
  --cluster chinese-medicine-platform-cluster \
  --services chinese-medicine-platform-backend \
  --region us-east-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,TaskDef:taskDefinition}' \
  --output table

# Check frontend service status
echo "Frontend service status:"
aws ecs describe-services \
  --cluster chinese-medicine-platform-cluster \
  --services chinese-medicine-platform-frontend \
  --region us-east-1 \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,TaskDef:taskDefinition}' \
  --output table

echo "🔍 Checking for any task failures..."
aws ecs describe-services \
  --cluster chinese-medicine-platform-cluster \
  --services chinese-medicine-platform-backend chinese-medicine-platform-frontend \
  --region us-east-1 \
  --query 'services[*].events[0].message' \
  --output table
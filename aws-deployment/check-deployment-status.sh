#!/bin/bash

echo "🔍 Checking deployment status..."
echo "=================================="

# Check ECS cluster
echo "📋 ECS Cluster Status:"
aws ecs describe-clusters \
  --clusters chinese-medicine-platform-cluster \
  --region us-east-1 \
  --query 'clusters[0].{Name:clusterName,Status:status,ActiveServices:activeServicesCount,RunningTasks:runningTasksCount}' \
  --output table

echo ""
echo "📋 Service Status:"
aws ecs describe-services \
  --cluster chinese-medicine-platform-cluster \
  --services chinese-medicine-platform-backend chinese-medicine-platform-frontend \
  --region us-east-1 \
  --query 'services[*].{Service:serviceName,Status:status,Running:runningCount,Desired:desiredCount,TaskDefinition:taskDefinition}' \
  --output table

echo ""
echo "🔍 Recent Events:"
aws ecs describe-services \
  --cluster chinese-medicine-platform-cluster \
  --services chinese-medicine-platform-backend chinese-medicine-platform-frontend \
  --region us-east-1 \
  --query 'services[*].events[0:2].[{Service:@.serviceName,Time:createdAt,Message:message}]' \
  --output table

echo ""
echo "🌐 Getting Public IPs of running tasks..."

# Get running tasks
BACKEND_TASKS=$(aws ecs list-tasks \
  --cluster chinese-medicine-platform-cluster \
  --service-name chinese-medicine-platform-backend \
  --desired-status RUNNING \
  --region us-east-1 \
  --query 'taskArns' \
  --output text)

FRONTEND_TASKS=$(aws ecs list-tasks \
  --cluster chinese-medicine-platform-cluster \
  --service-name chinese-medicine-platform-frontend \
  --desired-status RUNNING \
  --region us-east-1 \
  --query 'taskArns' \
  --output text)

if [ ! -z "$BACKEND_TASKS" ]; then
  echo "Backend task IPs:"
  for task in $BACKEND_TASKS; do
    aws ecs describe-tasks \
      --cluster chinese-medicine-platform-cluster \
      --tasks $task \
      --region us-east-1 \
      --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
      --output text | xargs -I {} aws ec2 describe-network-interfaces \
      --network-interface-ids {} \
      --region us-east-1 \
      --query 'NetworkInterfaces[0].Association.PublicIp' \
      --output text
  done
else
  echo "No running backend tasks found"
fi

if [ ! -z "$FRONTEND_TASKS" ]; then
  echo "Frontend task IPs:"
  for task in $FRONTEND_TASKS; do
    aws ecs describe-tasks \
      --cluster chinese-medicine-platform-cluster \
      --tasks $task \
      --region us-east-1 \
      --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
      --output text | xargs -I {} aws ec2 describe-network-interfaces \
      --network-interface-ids {} \
      --region us-east-1 \
      --query 'NetworkInterfaces[0].Association.PublicIp' \
      --output text
  done
else
  echo "No running frontend tasks found"
fi

echo ""
echo "💾 Database Status:"
aws rds describe-db-instances \
  --db-instance-identifier chinese-medicine-platform-db \
  --region us-east-1 \
  --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address,Port:Endpoint.Port}' \
  --output table
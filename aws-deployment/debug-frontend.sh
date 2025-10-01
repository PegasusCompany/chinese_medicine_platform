#!/bin/bash

echo "🔍 Debugging frontend service issues..."
echo "======================================"

# Get the latest failed task
TASK_ARN=$(aws ecs list-tasks \
  --cluster chinese-medicine-platform-cluster \
  --service-name chinese-medicine-platform-frontend \
  --desired-status STOPPED \
  --region us-east-1 \
  --query 'taskArns[0]' \
  --output text)

if [ "$TASK_ARN" != "None" ] && [ "$TASK_ARN" != "" ]; then
  echo "📋 Latest failed task: $TASK_ARN"
  
  echo ""
  echo "🔍 Task details:"
  aws ecs describe-tasks \
    --cluster chinese-medicine-platform-cluster \
    --tasks $TASK_ARN \
    --region us-east-1 \
    --query 'tasks[0].{StoppedReason:stoppedReason,LastStatus:lastStatus,StoppedAt:stoppedAt}' \
    --output table
  
  echo ""
  echo "📝 Container exit details:"
  aws ecs describe-tasks \
    --cluster chinese-medicine-platform-cluster \
    --tasks $TASK_ARN \
    --region us-east-1 \
    --query 'tasks[0].containers[0].{Name:name,ExitCode:exitCode,Reason:reason}' \
    --output table
else
  echo "No stopped tasks found"
fi

echo ""
echo "📊 Current service status:"
aws ecs describe-services \
  --cluster chinese-medicine-platform-cluster \
  --services chinese-medicine-platform-frontend \
  --region us-east-1 \
  --query 'services[0].events[0:3].[createdAt,message]' \
  --output table

echo ""
echo "🔍 Checking CloudWatch logs for frontend..."
aws logs describe-log-streams \
  --log-group-name "/ecs/chinese-medicine-platform-frontend" \
  --region us-east-1 \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --query 'logStreams[0].logStreamName' \
  --output text | xargs -I {} aws logs get-log-events \
  --log-group-name "/ecs/chinese-medicine-platform-frontend" \
  --log-stream-name {} \
  --region us-east-1 \
  --query 'events[-10:].message' \
  --output table
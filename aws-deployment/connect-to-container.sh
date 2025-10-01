#!/bin/bash

# Helper script to connect to ECS containers
set -e

PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"

if [ $# -eq 0 ]; then
    echo "Usage: $0 [backend|frontend]"
    echo "Example: $0 backend"
    exit 1
fi

SERVICE_NAME="$1"
CONTAINER_NAME="$1"

if [ "$SERVICE_NAME" != "backend" ] && [ "$SERVICE_NAME" != "frontend" ]; then
    echo "❌ Invalid service name. Use 'backend' or 'frontend'"
    exit 1
fi

echo "🔍 Finding running task for ${SERVICE_NAME}..."

# Get the task ARN
TASK_ARN=$(aws ecs list-tasks \
    --cluster ${PROJECT_NAME}-cluster \
    --service-name ${PROJECT_NAME}-${SERVICE_NAME} \
    --desired-status RUNNING \
    --query 'taskArns[0]' \
    --output text \
    --region ${REGION})

if [ "$TASK_ARN" = "None" ] || [ -z "$TASK_ARN" ]; then
    echo "❌ No running tasks found for ${SERVICE_NAME} service"
    exit 1
fi

echo "📱 Connecting to ${SERVICE_NAME} container..."
echo "Task ARN: ${TASK_ARN}"

# Choose the appropriate shell based on container
if [ "$SERVICE_NAME" = "backend" ]; then
    SHELL_CMD="/bin/bash"
else
    SHELL_CMD="/bin/sh"
fi

# Connect to the container
aws ecs execute-command \
    --cluster ${PROJECT_NAME}-cluster \
    --task ${TASK_ARN} \
    --container ${CONTAINER_NAME} \
    --interactive \
    --command "${SHELL_CMD}" \
    --region ${REGION}
#!/bin/bash

# Enable ECS Execute Command for existing services
set -e

PROJECT_NAME="chinese-medicine-platform"
REGION="us-east-1"
ACCOUNT_ID="975049890307"

echo "🔧 Enabling ECS Execute Command for existing services..."

# First, ensure the task role exists and has the necessary permissions
echo "📋 Checking/creating ECS task role..."

# Create the task role if it doesn't exist
aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }' \
    --region ${REGION} 2>/dev/null || echo "Task role may already exist"

# Attach the necessary policy for execute command
aws iam attach-role-policy \
    --role-name ecsTaskRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore \
    --region ${REGION} 2>/dev/null || echo "Policy may already be attached"

echo "📋 Updating task definitions with execute command support..."

# Register updated task definitions (they already have taskRoleArn added)
aws ecs register-task-definition --cli-input-json file://backend-task-def.json --region ${REGION}
aws ecs register-task-definition --cli-input-json file://frontend-task-def.json --region ${REGION}

echo "🔄 Updating services to enable execute command..."

# Update backend service
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-backend \
    --enable-execute-command \
    --force-new-deployment \
    --region ${REGION}

# Update frontend service
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-frontend \
    --enable-execute-command \
    --force-new-deployment \
    --region ${REGION}

echo "⏳ Waiting for services to stabilize..."
aws ecs wait services-stable \
    --cluster ${PROJECT_NAME}-cluster \
    --services ${PROJECT_NAME}-backend ${PROJECT_NAME}-frontend \
    --region ${REGION}

echo "✅ Execute command enabled! You can now use:"
echo "aws ecs execute-command --cluster ${PROJECT_NAME}-cluster --task <TASK_ARN> --container backend --interactive --command \"/bin/bash\""
echo "aws ecs execute-command --cluster ${PROJECT_NAME}-cluster --task <TASK_ARN> --container frontend --interactive --command \"/bin/sh\""

echo "🔍 To get task ARNs, run:"
echo "aws ecs list-tasks --cluster ${PROJECT_NAME}-cluster --region ${REGION}"
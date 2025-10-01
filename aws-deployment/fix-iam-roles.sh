#!/bin/bash

echo "🔧 Creating ECS Task Execution Role..."

# Create trust policy for ECS tasks
cat > trust-policy.json << EOF
{
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
}
EOF

# Create the role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json \
  --description "ECS Task Execution Role for Chinese Medicine Platform"

# Attach the AWS managed policy for ECS task execution
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Also attach ECR permissions
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

echo "✅ ECS Task Execution Role created successfully"

# Clean up temp file
rm trust-policy.json

echo "🔄 Updating ECS services to use the new task definitions..."

# Update backend service to use latest task definition
aws ecs update-service \
  --cluster chinese-medicine-platform-cluster \
  --service chinese-medicine-platform-backend \
  --task-definition chinese-medicine-platform-backend:2 \
  --region us-east-1

echo "✅ Backend service updated"

# Check if frontend service exists, if not create it
if aws ecs describe-services --cluster chinese-medicine-platform-cluster --services chinese-medicine-platform-frontend --region us-east-1 2>/dev/null | grep -q "chinese-medicine-platform-frontend"; then
  echo "Frontend service exists, updating..."
  aws ecs update-service \
    --cluster chinese-medicine-platform-cluster \
    --service chinese-medicine-platform-frontend \
    --task-definition chinese-medicine-platform-frontend:2 \
    --region us-east-1
else
  echo "Creating frontend service..."
  aws ecs create-service \
    --cluster chinese-medicine-platform-cluster \
    --service-name chinese-medicine-platform-frontend \
    --task-definition chinese-medicine-platform-frontend:2 \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-0adc0477c1606c638,subnet-01a2abd11ae7196d9],securityGroups=[sg-0b608e7aac9c6dcf9],assignPublicIp=ENABLED}" \
    --region us-east-1
fi

echo "✅ Services updated/created successfully"
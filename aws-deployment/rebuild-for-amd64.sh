#!/bin/bash

echo "🔧 Rebuilding Docker images for AMD64 platform..."
echo "=================================================="

# Get AWS account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-east-1"

echo "📋 AWS Account ID: $ACCOUNT_ID"
echo "📋 Region: $REGION"

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo "🐳 Building multi-platform images..."

# Build and push backend image for AMD64
echo "Building backend image for AMD64..."
cd ../backend
docker buildx build --platform linux/amd64 -t chinese-medicine-platform-backend:latest -f Dockerfile.prod .
docker tag chinese-medicine-platform-backend:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/chinese-medicine-platform-backend:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/chinese-medicine-platform-backend:latest
echo "✅ Backend image pushed for AMD64"

# Get backend IP from running task
echo "🔍 Getting backend IP address..."
BACKEND_IP=$(aws ecs describe-tasks \
  --cluster chinese-medicine-platform-cluster \
  --tasks $(aws ecs list-tasks --cluster chinese-medicine-platform-cluster --service-name chinese-medicine-platform-backend --query 'taskArns[0]' --output text) \
  --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
  --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query 'NetworkInterfaces[0].Association.PublicIp' --output text)

if [ -z "$BACKEND_IP" ] || [ "$BACKEND_IP" = "None" ]; then
  echo "⚠️  Could not get backend IP, using default"
  BACKEND_IP="35.170.77.82"
fi

echo "📋 Backend IP: $BACKEND_IP"

# Build and push frontend image for AMD64
echo "Building frontend image for AMD64..."
cd ../frontend
docker buildx build --platform linux/amd64 \
  --build-arg REACT_APP_API_URL=http://$BACKEND_IP:5000 \
  -t chinese-medicine-platform-frontend:latest \
  -f Dockerfile.prod .
docker tag chinese-medicine-platform-frontend:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/chinese-medicine-platform-frontend:latest
docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/chinese-medicine-platform-frontend:latest
echo "✅ Frontend image pushed for AMD64"

cd ../aws-deployment

echo "🔄 Forcing service updates to pull new images..."

# Force update backend service
aws ecs update-service \
  --cluster chinese-medicine-platform-cluster \
  --service chinese-medicine-platform-backend \
  --force-new-deployment \
  --region $REGION

# Force update frontend service  
aws ecs update-service \
  --cluster chinese-medicine-platform-cluster \
  --service chinese-medicine-platform-frontend \
  --force-new-deployment \
  --region $REGION

echo "✅ Services updated to pull new AMD64 images"
echo "⏳ Wait 2-3 minutes for tasks to start, then run ./check-deployment-status.sh"
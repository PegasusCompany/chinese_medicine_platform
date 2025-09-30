# AWS Deployment Guide - Chinese Medicine Platform

This guide will help you deploy the Chinese Medicine Platform to AWS for your hackathon submission.

## 🚀 Quick Deployment

### Prerequisites
1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Docker** installed and running
4. **Git** repository with your code

### One-Command Deployment
```bash
cd aws-deployment
./deploy.sh
```

This script will:
- Create ECR repositories for your Docker images
- Build and push Docker images to ECR
- Deploy infrastructure using CloudFormation
- Deploy ECS services with your application
- Initialize the database with demo data
- Provide you with a public URL

## 🏗️ Architecture

The deployment creates:

- **VPC** with public/private subnets across 2 AZs
- **Application Load Balancer** for traffic distribution
- **ECS Fargate** services for containerized apps
- **RDS PostgreSQL** database in private subnets
- **CloudWatch** logs for monitoring
- **Security Groups** with least-privilege access

## 📊 What Gets Deployed

### Infrastructure
- **Frontend**: React app served via Nginx on ECS Fargate
- **Backend**: Node.js API on ECS Fargate
- **Database**: PostgreSQL RDS instance
- **Load Balancer**: Routes traffic to frontend/backend
- **Networking**: Secure VPC with proper subnets

### Demo Data
- **130+ Hong Kong approved herbs** with bilingual names
- **10 suppliers** with realistic pricing strategies
- **23 demo prescriptions** with various TCM diagnoses
- **Complete order workflow** examples
- **Test user accounts** for immediate testing

## 🔧 Configuration

### Environment Variables
The deployment automatically configures:
- `NODE_ENV=production`
- `DATABASE_URL` (auto-generated from RDS)
- `JWT_SECRET` (auto-generated)
- `REACT_APP_API_URL` (auto-generated from ALB)

### Costs (Estimated)
- **ECS Fargate**: ~$20-30/month for 2 services
- **RDS t3.micro**: ~$15-20/month
- **Load Balancer**: ~$20/month
- **Data Transfer**: Minimal for demo usage
- **Total**: ~$55-70/month

## 🧪 Testing Your Deployment

Once deployed, you can test with these accounts:

**Practitioner Account:**
- Email: `practitioner@test.com`
- Password: `password123`

**Supplier Accounts:**
- `supplier@test.com` (Golden Herbs - Premium)
- `dragonwell@test.com` (Dragon Well - Competitive)
- `jademountain@test.com` (Jade Mountain - Ultra Premium)
- `harmony@test.com` (Harmony - Budget)
- `phoenix@test.com` (Phoenix - Balanced)
- Password: `password123` (for all)

## 🎯 Hackathon Features to Showcase

1. **Bilingual Interface** - English/Chinese herb names
2. **Supplier Comparison** - Multiple suppliers with different pricing
3. **TCM Expertise** - Authentic diagnoses and prescriptions
4. **Order Management** - Complete prescription-to-order workflow
5. **Scalable Architecture** - Cloud-native AWS deployment

## 🔍 Monitoring

### CloudWatch Logs
- Frontend logs: `/ecs/chinese-medicine-platform-frontend`
- Backend logs: `/ecs/chinese-medicine-platform-backend`

### Health Checks
- Frontend: `http://your-alb-dns/`
- Backend: `http://your-alb-dns/health`
- API: `http://your-alb-dns/api/health`

## 🧹 Cleanup

To avoid ongoing charges after the hackathon:

```bash
./cleanup.sh
```

This will delete all AWS resources created by the deployment.

## 🆘 Troubleshooting

### Common Issues

1. **Services not starting**
   - Check CloudWatch logs for errors
   - Verify security group rules
   - Ensure images were pushed successfully

2. **Database connection issues**
   - Verify RDS is in running state
   - Check security group allows ECS access
   - Confirm DATABASE_URL is correct

3. **Frontend can't reach backend**
   - Verify ALB listener rules
   - Check target group health
   - Confirm API URL is correct in frontend

### Manual Database Setup
If automatic database setup fails:

1. Go to ECS Console
2. Find the backend task
3. Use "Execute command" to run: `npm run setup`

## 📞 Support

For deployment issues:
1. Check CloudWatch logs first
2. Verify AWS permissions
3. Ensure Docker is running locally
4. Check AWS service limits

## 🏆 Hackathon Submission

Your deployment will provide:
- **Public URL** for judges to access
- **Demo accounts** for immediate testing
- **Comprehensive features** showcasing TCM platform
- **Professional deployment** on AWS infrastructure

Perfect for demonstrating your Chinese Medicine Platform to hackathon judges!
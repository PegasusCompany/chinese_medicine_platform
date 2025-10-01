# AWS Deployment Guide - Chinese Medicine Platform (Improved)

This guide will help you deploy the Chinese Medicine Platform to AWS with all debugging fixes included.

## 🚀 Quick Deployment

### Prerequisites
1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Docker** installed and running
4. **Git** repository with your code

### One-Command Deployment (Improved)
```bash
cd aws-deployment
./deploy.sh
```

This improved script will:
- Create ECR repositories for your Docker images
- Build and push Docker images with correct architecture (AMD64)
- Deploy infrastructure using CloudFormation
- Deploy ECS services with your application
- **Fix RDS SSL configuration automatically**
- **Configure security groups for database connectivity**
- **Add missing database columns**
- **Initialize database with comprehensive setup**
- **Create 23+ demo prescriptions with order history**
- **Rebuild frontend with correct backend API URL**
- Provide you with working application URLs

## 🔧 **Key Improvements (Lessons Learned)**

### 1. **Docker Architecture Fix**
- All images now built with `--platform linux/amd64` for AWS Fargate compatibility
- Prevents "image Manifest does not contain descriptor matching platform" errors

### 2. **Database Connectivity Fix**
- Automatic RDS parameter group creation with `rds.force_ssl=0`
- Security group rules configured for VPC-wide database access
- Database reboot handled automatically

### 3. **Database Schema Fix**
- Missing columns (`patient_dob`, `symptoms`, `diagnosis`) added automatically
- Status column expanded to VARCHAR(50) for longer status names
- Schema fixes applied before data population

### 4. **Frontend API URL Fix**
- Frontend rebuilt with actual backend IP after deployment
- No more placeholder URLs or connection timeouts
- Automatic service redeployment with correct configuration

### 5. **Comprehensive Demo Data**
- 23 realistic TCM prescriptions with authentic diagnoses
- Complete order workflow with various statuses
- Bilingual herb names and patient information

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

## 🆘 Troubleshooting (Improved)

### Automated Troubleshooting
```bash
./troubleshoot.sh
```

This script provides:
- Service status checks
- IP address discovery
- Connectivity testing
- Database connection verification
- Automatic issue fixes
- Recent log viewing

### Common Issues (Now Auto-Fixed)

1. **Database Connection Timeout** ✅ **FIXED**
   - **Issue**: ECS tasks couldn't reach RDS database
   - **Fix**: Security groups automatically configured
   - **Prevention**: VPC-wide database access rules added

2. **SSL Authentication Errors** ✅ **FIXED**
   - **Issue**: `no pg_hba.conf entry for host` errors
   - **Fix**: RDS parameter group with `rds.force_ssl=0`
   - **Prevention**: Database automatically rebooted with new settings

3. **Docker Architecture Mismatch** ✅ **FIXED**
   - **Issue**: ARM64 images failing on AMD64 Fargate
   - **Fix**: All builds use `--platform linux/amd64`
   - **Prevention**: Consistent architecture across all images

4. **Frontend API Connection Failures** ✅ **FIXED**
   - **Issue**: Frontend using placeholder/wrong backend URLs
   - **Fix**: Frontend rebuilt with actual backend IP
   - **Prevention**: Dynamic IP discovery and rebuild process

5. **Missing Database Schema** ✅ **FIXED**
   - **Issue**: Demo data failing due to missing columns
   - **Fix**: Schema automatically updated before data population
   - **Prevention**: Comprehensive schema validation

6. **Demo Data Missing** ✅ **FIXED**
   - **Issue**: Empty order history and prescriptions
   - **Fix**: 23+ realistic prescriptions automatically created
   - **Prevention**: Demo data creation included in deployment

### Manual Fixes (If Needed)

If automatic fixes fail, you can run individual components:

```bash
# Fix database connectivity
./fix-database-connectivity.sh

# Fix RDS SSL settings
./fix-rds-ssl.sh

# Rebuild frontend with correct API URL
./fix-frontend-api-url.sh

# Add missing database schema
./fix-demo-schema.sh
```

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
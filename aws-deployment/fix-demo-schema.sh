#!/bin/bash

# Fix database schema for demo data

echo "🔧 Fixing database schema for demo data..."

# Get current backend task ID
TASK_ID=$(aws ecs list-tasks --cluster chinese-medicine-platform-cluster --service-name chinese-medicine-platform-backend --desired-status RUNNING --query 'taskArns[0]' --output text | cut -d'/' -f3)

echo "📋 Using backend task: $TASK_ID"

# Add missing columns step by step
echo "➕ Adding patient_dob column..."
aws ecs execute-command \
  --cluster chinese-medicine-platform-cluster \
  --task $TASK_ID \
  --container backend \
  --interactive \
  --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_dob DATE').then(() => console.log('✅ patient_dob added')).catch(e => console.log('⚠️ ', e.message))\""

echo "➕ Adding symptoms column..."
aws ecs execute-command \
  --cluster chinese-medicine-platform-cluster \
  --task $TASK_ID \
  --container backend \
  --interactive \
  --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS symptoms TEXT').then(() => console.log('✅ symptoms added')).catch(e => console.log('⚠️ ', e.message))\""

echo "➕ Adding diagnosis column..."
aws ecs execute-command \
  --cluster chinese-medicine-platform-cluster \
  --task $TASK_ID \
  --container backend \
  --interactive \
  --command "node -e \"require('./config/database').query('ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT').then(() => console.log('✅ diagnosis added')).catch(e => console.log('⚠️ ', e.message))\""

echo "🎉 Schema updates completed!"
echo "Now you can run: npm run demo-data"
# Chinese Herb Import System

## Overview

This system provides flexible herb data import capabilities designed for cloud deployment and Hong Kong government data compliance.

## Features

### 🏥 Hong Kong Government Compliance
- Supports official Hong Kong Chinese Medicine regulatory data
- Includes approval status tracking
- Maintains Traditional Chinese names (繁體中文)
- Tracks contraindications and dosage ranges

### 🌐 Cloud-Ready Architecture
- Local file import
- Remote URL import (HTTP/HTTPS)
- AWS S3 integration
- Import logging and history
- Batch processing for large datasets

### 📊 Data Formats Supported
- **JSON**: Structured herb data with metadata
- **CSV**: Simple spreadsheet format
- **Government formats**: Adaptable field mapping

## Quick Start

### 1. Import Hong Kong Common Herbs (Pre-loaded)
```bash
# Already imported 50 common HK herbs
docker-compose exec backend npm run import-hk-herbs
```

### 2. Import from Local File
```bash
# JSON format
docker-compose exec backend npm run import-herbs data/your-herbs.json

# CSV format  
docker-compose exec backend npm run import-herbs data/your-herbs.csv --update-existing
```

### 3. Cloud Import (Production)
```bash
# From URL
docker-compose exec backend npm run cloud-import https://api.gov.hk/herbs.json

# From AWS S3
docker-compose exec backend npm run cloud-import s3://your-bucket/herbs.json

# View import history
docker-compose exec backend npm run cloud-import --history
```

## Data Structure

### Required Fields
- `name`: English herb name
- `chinese_name`: Traditional Chinese name (繁體中文)

### Optional Fields
- `description`: Therapeutic description
- `category`: TCM category (e.g., "Qi Tonifying", "Heat Clearing")
- `properties`: TCM properties (e.g., "Sweet, warm")
- `dosage_range`: Recommended dosage (e.g., "3-9g")
- `approval_status`: Regulatory status ("Approved", "Restricted")
- `contraindications`: Safety warnings

### Example JSON Format
```json
{
  "source": "Hong Kong Government - Chinese Medicine Division",
  "herbs": [
    {
      "name": "Ginseng",
      "chinese_name": "人參",
      "description": "Tonifies qi, strengthens spleen and lung",
      "category": "Qi Tonifying",
      "properties": "Sweet, slightly bitter, slightly warm",
      "dosage_range": "3-9g",
      "approval_status": "Approved"
    }
  ]
}
```

### Example CSV Format
```csv
name,chinese_name,description,category,properties,dosage_range,approval_status
Ginseng,人參,Tonifies qi and strengthens organs,Qi Tonifying,Sweet and warm,3-9g,Approved
Astragalus,黃芪,Immune support and qi tonification,Qi Tonifying,Sweet and warm,9-30g,Approved
```

## Field Mapping

The system automatically maps various field name variations:

| Standard Field | Accepted Variations |
|---------------|-------------------|
| `name` | name, english_name, herb_name, Name |
| `chinese_name` | chinese_name, chinese, 中文名, 藥材名 |
| `category` | category, type, Category, 類別 |
| `properties` | properties, nature, Properties, 性味 |
| `approval_status` | approval_status, status, Status, 批准狀態 |

## Import Options

### Update Existing Herbs
```bash
--update-existing    # Update existing herbs instead of skipping
```

### Batch Processing
```bash
--batch-size=100     # Process 100 herbs at a time (default)
--batch-size=50      # Smaller batches for limited memory
```

## Cloud Deployment

### Environment Variables
```bash
NODE_ENV=production
HERBS_DATA_URL=https://api.gov.hk/herbs.json
DATABASE_URL=postgresql://user:pass@host:5432/db
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

### AWS S3 Setup
1. Upload herb data files to S3 bucket
2. Configure IAM permissions for S3 access
3. Use S3 URLs in import commands

### Automated Updates
```bash
# Add to cron job or AWS Lambda
0 2 * * 0 docker-compose exec backend npm run cloud-import --default
```

## Import Logging

All imports are logged to the `import_logs` table:
- Source URL/file
- Import statistics
- Error messages
- Timestamp and user

View history:
```bash
docker-compose exec backend npm run cloud-import --history
```

## Hong Kong Government Sources

### Recommended Official Sources
1. **Chinese Medicine Council of Hong Kong (CMCHK)**
   - Official herb registry
   - Regulatory compliance data

2. **Department of Health - Chinese Medicine Division**
   - Approved medicinal materials
   - Safety guidelines

3. **Hospital Authority - Chinese Medicine Service**
   - Clinical practice standards
   - Evidence-based herb lists

### Data Update Frequency
- Government data: Quarterly/Annual updates
- Import when new regulations published
- Maintain audit trail for compliance

## Troubleshooting

### Common Issues

**Missing Dependencies**
```bash
docker-compose build backend  # Rebuild with dependencies
```

**Database Schema Issues**
```bash
docker-compose exec backend npm run migrate  # Update schema
```

**Import Validation Errors**
- Check required fields (name, chinese_name)
- Verify file format and encoding
- Review field mapping variations

### Support

For Hong Kong regulatory compliance questions, consult:
- Chinese Medicine Council of Hong Kong
- Department of Health - Chinese Medicine Division
- Local TCM regulatory experts

## Current Database

The system now includes **50 commonly used Hong Kong Chinese herbs** with:
- ✅ Traditional Chinese names (繁體中文)
- ✅ TCM categories and properties  
- ✅ Dosage ranges
- ✅ Approval status
- ✅ Safety information

Ready for immediate use in prescriptions and inventory management!
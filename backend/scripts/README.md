# Backend Scripts Directory

This directory contains organized scripts for database management, data import, seeding, and setup operations.

## Directory Structure

```
scripts/
├── database/                    # Database schema and management
│   ├── migrate.js              # Main database schema creation
│   ├── cleanup.js              # Clean transactional data
│   └── migrations/             # Individual schema migrations
│       ├── add-doses-per-day.js
│       └── add-herb-columns.js
├── data/                       # Data import and management
│   ├── import-herbs.js         # Core herb data importer
│   ├── cloud-import.js         # Cloud-based data import
│   └── generators/             # Data generation scripts
│       ├── generate-comprehensive-herbs.js
│       └── create-full-hk-database.js
├── seed/                       # Test data and seeding
│   ├── seed-users.js           # Create test users
│   ├── seed-suppliers-with-pricing.js  # Create suppliers with inventory
│   └── demo/                   # Demo data for presentations
│       └── create-demo-data.js
├── setup/                      # Orchestration and setup
│   └── setup-foundation.js    # Complete system setup
└── README.md                   # This file
```

## Quick Start

### Complete System Setup
```bash
# Run the complete foundation setup (recommended for new installations)
docker-compose exec backend node scripts/setup/setup-foundation.js
```

This will:
1. Clean the database
2. Create all tables and schema
3. Add necessary columns and migrations
4. Create test users
5. Set up suppliers with realistic pricing
6. Import Hong Kong herbs database

### Individual Operations

#### Database Management
```bash
# Create database schema
docker-compose exec backend node scripts/database/migrate.js

# Clean transactional data (keeps structure)
docker-compose exec backend node scripts/database/cleanup.js

# Run specific migrations
docker-compose exec backend node scripts/database/migrations/add-doses-per-day.js
docker-compose exec backend node scripts/database/migrations/add-herb-columns.js
```

#### Data Import
```bash
# Import herbs from local file
docker-compose exec backend node scripts/data/import-herbs.js data/hk-comprehensive-herbs.json

# Import with options
docker-compose exec backend node scripts/data/import-herbs.js data/herbs.csv --update-existing --batch-size=50

# Cloud import (URLs, S3, etc.)
docker-compose exec backend node scripts/data/cloud-import.js https://api.example.com/herbs.json
docker-compose exec backend node scripts/data/cloud-import.js s3://bucket/herbs.json
```

#### Seeding and Test Data
```bash
# Create test users (practitioner and supplier accounts)
docker-compose exec backend node scripts/seed/seed-users.js

# Create multiple suppliers with realistic pricing
docker-compose exec backend node scripts/seed/seed-suppliers-with-pricing.js

# Create comprehensive demo data for presentations
docker-compose exec backend node scripts/seed/demo/create-demo-data.js
```

#### Data Generation
```bash
# Generate comprehensive herbs database
docker-compose exec backend node scripts/data/generators/generate-comprehensive-herbs.js

# Create full Hong Kong database
docker-compose exec backend node scripts/data/generators/create-full-hk-database.js
```

## Script Categories

### Database Scripts
- **migrate.js**: Creates all database tables and core schema
- **cleanup.js**: Removes transactional data while preserving structure
- **migrations/**: Individual schema changes that can be run independently

### Data Scripts
- **import-herbs.js**: Flexible herb data importer supporting CSV/JSON
- **cloud-import.js**: Import from URLs, S3, or other cloud sources
- **generators/**: Scripts that create comprehensive herb datasets

### Seed Scripts
- **seed-users.js**: Creates test practitioner and supplier accounts
- **seed-suppliers-with-pricing.js**: Creates multiple suppliers with realistic Hong Kong pricing
- **demo/create-demo-data.js**: Creates comprehensive demo prescriptions for presentations

### Setup Scripts
- **setup-foundation.js**: Orchestrates complete system setup in correct order

## Test Credentials

After running the setup, you can use these test accounts:

**Practitioner Account:**
- Email: `practitioner@test.com`
- Password: `password123`

**Supplier Accounts:**
- `supplier@test.com` (Golden Herbs Supply Co.)
- `dragonwell@test.com` (Dragon Well Herbs Ltd.)
- `jademountain@test.com` (Jade Mountain Trading)
- `harmony@test.com` (Harmony Herb Wholesale)
- `phoenix@test.com` (Phoenix Traditional Medicine)
- Password: `password123` (for all)

## Features

### Import Features
- Support for CSV and JSON formats
- Flexible field mapping (handles different column names)
- Batch processing for large datasets
- Update existing records or skip duplicates
- Comprehensive validation and error handling
- Import logging and history tracking

### Supplier Features
- Multiple supplier strategies (premium, competitive, budget, etc.)
- Realistic Hong Kong pricing (HK$ per gram)
- Quality grades (A, B, C)
- Stock level simulation
- Expiry date management

### Demo Data Features
- 25+ realistic TCM cases with proper diagnoses
- Bilingual herb names (English/Chinese)
- Various prescription statuses
- Time-distributed data for filtering tests
- Complete order workflow examples

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Make sure database is running
   docker-compose up -d db
   ```

2. **Permission Errors**
   ```bash
   # Run from backend directory
   cd backend
   node scripts/setup/setup-foundation.js
   ```

3. **Missing Dependencies**
   ```bash
   # Install dependencies
   npm install
   ```

4. **Import Failures**
   - Check file paths are relative to backend directory
   - Ensure data files exist in backend/data/
   - Verify database schema is created first

### Getting Help

- Check script output for detailed error messages
- Ensure scripts are run in the correct order
- Verify database connection settings in config/database.js
- Run setup-foundation.js for complete clean installation

## Development

### Adding New Scripts

1. Place scripts in appropriate category directory
2. Follow existing naming conventions (kebab-case)
3. Include proper error handling and logging
4. Update this README with usage instructions
5. Consider adding to setup-foundation.js if part of core setup

### Script Conventions

- Use descriptive console logging with emojis for clarity
- Include proper error handling with meaningful messages
- Support command-line arguments where appropriate
- Export main functions for programmatic use
- Include usage instructions in script comments
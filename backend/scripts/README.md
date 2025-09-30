# Backend Scripts Directory

This directory contains organized scripts for database management, data import, seeding, and setup operations for the HerbLink AI Traditional Chinese Medicine platform.

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
│   ├── import-herbs.js         # Core herb data importer with CSV/JSON support
│   ├── cloud-import.js         # Cloud-based data import (AWS/Azure/GCP)
│   └── generators/             # Data generation scripts
│       ├── generate-comprehensive-herbs.js
│       └── create-full-hk-database.js
├── seed/                       # Test data and seeding
│   ├── seed-users.js           # Create test users (practitioners/suppliers)
│   ├── seed-suppliers-with-pricing.js  # Create suppliers with HK pricing
│   ├── enrich-supplier-inventory.js    # Enrich supplier inventory with realistic data
│   └── demo/                   # Demo data for presentations
│       └── create-demo-data.js # Complete demo prescriptions and orders
├── setup/                      # Orchestration and setup
│   └── setup-foundation.js    # Complete system setup orchestration
└── README.md                   # This file
```

## Quick Start

### Complete System Setup
```bash
# Run the complete foundation setup (recommended for new installations)
docker-compose exec backend npm run setup
# OR
docker-compose exec backend node scripts/setup/setup-foundation.js
```

This comprehensive setup will:
1. Clean the database completely
2. Create all tables and schema (users, herbs, prescriptions, orders, etc.)
3. Add necessary columns and migrations (doses_per_day, herb enhancements)
4. Create test users (practitioners and suppliers)
5. Set up 5 suppliers with realistic Hong Kong pricing strategies
6. Import 300+ Hong Kong approved herbs database
7. Enrich supplier inventory with essential demo herbs
8. Create sample demo prescriptions and orders

### NPM Script Shortcuts
```bash
# Database operations
npm run migrate          # Create database schema
npm run cleanup          # Clean transactional data
npm run add-doses        # Add doses per day migration
npm run add-herb-columns # Add herb table enhancements

# Data operations
npm run import-herbs     # Import herbs from default file
npm run import-hk-herbs  # Import Hong Kong herbs specifically
npm run cloud-import     # Import from cloud sources
npm run generate-herbs   # Generate comprehensive herb dataset

# Seeding operations
npm run seed             # Create test users
npm run seed-suppliers   # Create suppliers with pricing
npm run enrich-inventory # Enrich supplier inventory
npm run demo-data        # Create demo prescriptions and orders
```

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
docker-compose exec backend npm run import-herbs data/hk-comprehensive-herbs.json
docker-compose exec backend node scripts/data/import-herbs.js data/hk-comprehensive-herbs.json

# Import with advanced options
docker-compose exec backend node scripts/data/import-herbs.js data/herbs.csv --update-existing --batch-size=50 --validate-only
docker-compose exec backend node scripts/data/import-herbs.js --generate-samples --count=100

# Cloud import (URLs, S3, Azure, GCP)
docker-compose exec backend npm run cloud-import https://api.example.com/herbs.json
docker-compose exec backend node scripts/data/cloud-import.js s3://bucket/herbs.json
docker-compose exec backend node scripts/data/cloud-import.js https://storage.googleapis.com/bucket/herbs.json
docker-compose exec backend node scripts/data/cloud-import.js https://myaccount.blob.core.windows.net/container/herbs.json

# Generate comprehensive datasets
docker-compose exec backend npm run generate-herbs
docker-compose exec backend node scripts/data/generators/create-full-hk-database.js
```

#### Seeding and Test Data
```bash
# Create test users (practitioner and supplier accounts)
docker-compose exec backend npm run seed
docker-compose exec backend node scripts/seed/seed-users.js

# Create multiple suppliers with realistic Hong Kong pricing strategies
docker-compose exec backend npm run seed-suppliers
docker-compose exec backend node scripts/seed/seed-suppliers-with-pricing.js

# Enrich supplier inventory with essential herbs for demos
docker-compose exec backend npm run enrich-inventory
docker-compose exec backend node scripts/seed/enrich-supplier-inventory.js

# Create comprehensive demo data for presentations
docker-compose exec backend npm run demo-data
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
- **migrate.js**: Creates all database tables and core schema (users, herbs, prescriptions, orders, suppliers, inventory)
- **cleanup.js**: Removes transactional data while preserving structure and reference data
- **migrations/add-doses-per-day.js**: Adds doses_per_day column to prescriptions table
- **migrations/add-herb-columns.js**: Adds enhanced herb metadata (categories, properties, contraindications)

### Data Scripts
- **import-herbs.js**: Flexible herb data importer supporting CSV/JSON with field mapping, validation, and batch processing
- **cloud-import.js**: Cloud-ready import from URLs, AWS S3, Azure Blob, Google Cloud Storage with automatic cleanup
- **generators/generate-comprehensive-herbs.js**: Generates comprehensive herb datasets with TCM properties
- **generators/create-full-hk-database.js**: Creates complete Hong Kong regulatory-compliant herb database

### Seed Scripts
- **seed-users.js**: Creates test practitioner and supplier accounts with proper authentication
- **seed-suppliers-with-pricing.js**: Creates 5 suppliers with different pricing strategies (premium, competitive, budget)
- **enrich-supplier-inventory.js**: Enriches supplier inventory with 25+ essential herbs and realistic Hong Kong pricing
- **demo/create-demo-data.js**: Creates 25+ realistic TCM prescriptions with bilingual names and complete order workflows

### Setup Scripts
- **setup-foundation.js**: Orchestrates complete system setup in correct dependency order with comprehensive logging

## Test Credentials

After running the setup, you can use these test accounts:

**Practitioner Account:**
- Email: `practitioner@test.com`
- Password: `password123`
- Role: Can create prescriptions, view orders, compare suppliers

**Supplier Accounts:**
- `supplier@test.com` (Golden Herbs Supply Co.) - Premium quality, standard pricing
- `dragonwell@test.com` (Dragon Well Herbs Ltd.) - Good quality, competitive pricing (-15%)
- `jademountain@test.com` (Jade Mountain Trading) - Premium quality, premium pricing (+25%)
- `harmony@test.com` (Harmony Herb Wholesale) - Basic quality, budget pricing (-30%)
- `phoenix@test.com` (Phoenix Traditional Medicine) - Good quality, fair pricing (-5%)
- Password: `password123` (for all)
- Role: Can manage inventory, fulfill orders, view analytics

## Features

### Import Features
- **Multi-format support**: CSV, JSON, and cloud sources (URLs, S3, Azure, GCP)
- **Flexible field mapping**: Handles different column names and data structures
- **Batch processing**: Configurable batch sizes for large datasets (default 100 records)
- **Data validation**: Comprehensive validation with detailed error reporting
- **Update strategies**: Update existing records, skip duplicates, or validate-only mode
- **Import logging**: Complete audit trail with import history and error tracking
- **Sample generation**: Generate sample herb data for testing
- **Cloud integration**: Direct import from cloud storage with automatic cleanup

### Supplier Features
- **Pricing strategies**: 5 different supplier strategies (premium, competitive, budget, wholesale, fair)
- **Hong Kong pricing**: Realistic HK$ per gram pricing based on market research
- **Quality grades**: A, B, C quality grades affecting pricing
- **Stock management**: Realistic stock levels with expiry date tracking
- **Inventory enrichment**: Essential herbs automatically added to all suppliers
- **Supplier profiles**: Complete business profiles with contact information

### Demo Data Features
- **Realistic prescriptions**: 25+ authentic TCM cases with proper diagnoses
- **Bilingual support**: Complete English/Traditional Chinese herb names (繁體中文)
- **Order workflows**: Complete order lifecycle from prescription to fulfillment
- **Time distribution**: Data spread across different time periods for filtering
- **Status variety**: Multiple prescription and order statuses for testing
- **Patient diversity**: Various patient profiles and medical conditions

### Database Features
- **Schema management**: Complete PostgreSQL schema with proper relationships
- **Migration system**: Individual migrations for incremental updates
- **Data cleanup**: Selective cleanup preserving reference data
- **Constraint handling**: Proper foreign key relationships and data integrity
- **Index optimization**: Optimized queries for herb search and filtering

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Make sure database is running
   docker-compose up -d db
   
   # Check database logs
   docker-compose logs db
   
   # Verify connection settings
   docker-compose exec backend node -e "console.log(require('./config/database'))"
   ```

2. **Permission Errors**
   ```bash
   # Ensure you're in the correct directory
   cd backend
   
   # Run with proper permissions
   docker-compose exec backend npm run setup
   ```

3. **Missing Dependencies**
   ```bash
   # Install backend dependencies
   cd backend && npm install
   
   # Rebuild containers if needed
   docker-compose build backend
   ```

4. **Import Failures**
   - Check file paths are relative to backend directory
   - Ensure data files exist in backend/data/
   - Verify database schema is created first with `npm run migrate`
   - Check import logs for detailed error messages
   - Use `--validate-only` flag to test imports without committing

5. **Cloud Import Issues**
   ```bash
   # Check network connectivity
   curl -I https://your-data-source.com/herbs.json
   
   # Verify cloud credentials (for S3/Azure/GCP)
   # Check environment variables for cloud access
   ```

6. **Supplier Data Issues**
   ```bash
   # Re-run supplier setup
   docker-compose exec backend npm run seed-suppliers
   
   # Enrich inventory if suppliers exist but lack herbs
   docker-compose exec backend npm run enrich-inventory
   ```

7. **Demo Data Problems**
   ```bash
   # Ensure herbs and suppliers exist first
   docker-compose exec backend npm run import-hk-herbs
   docker-compose exec backend npm run seed-suppliers
   
   # Then create demo data
   docker-compose exec backend npm run demo-data
   ```

### Getting Help

- **Check script output**: All scripts provide detailed logging with emojis for easy identification
- **Run in correct order**: Use `npm run setup` for proper dependency order
- **Verify database**: Check connection settings in `config/database.js`
- **Clean installation**: Run `npm run setup` for complete clean installation
- **Individual components**: Run specific scripts if only certain components need fixing
- **Validation mode**: Use `--validate-only` flags to test without making changes
- **Log analysis**: Check import logs in database for detailed error tracking

## Development

### Adding New Scripts

1. **Directory placement**: Place scripts in appropriate category directory (database/, data/, seed/, setup/)
2. **Naming conventions**: Use kebab-case for script files (e.g., `seed-new-data.js`)
3. **Error handling**: Include comprehensive error handling with meaningful messages
4. **Logging**: Use descriptive console logging with emojis for visual clarity
5. **Documentation**: Update this README with usage instructions and add to package.json scripts
6. **Integration**: Consider adding to `setup-foundation.js` if part of core setup flow
7. **Testing**: Test scripts in isolation and as part of complete setup

### Script Conventions

- **Logging format**: Use emojis and clear messages (`console.log('🌿 Importing herbs...')`)
- **Error handling**: Catch and log errors with context and suggested solutions
- **Command-line args**: Support relevant CLI arguments with help text
- **Modularity**: Export main functions for programmatic use by other scripts
- **Documentation**: Include usage instructions and examples in script comments
- **Database safety**: Use transactions where appropriate and provide rollback options
- **Progress indicators**: Show progress for long-running operations
- **Validation**: Validate inputs and provide clear feedback on issues

### NPM Script Integration

When adding new scripts, add corresponding npm scripts to `package.json`:

```json
{
  "scripts": {
    "your-script": "node scripts/category/your-script.js",
    "your-script-with-args": "node scripts/category/your-script.js --default-args"
  }
}
```

### Cloud Deployment Considerations

- Scripts are designed to work in containerized environments (Docker, Kubernetes)
- Support for cloud storage imports (AWS S3, Azure Blob, Google Cloud Storage)
- Environment variable configuration for different deployment environments
- Temporary file handling with proper cleanup for cloud environments
- Logging integration for cloud monitoring and debugging
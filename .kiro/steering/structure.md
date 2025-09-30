# Project Structure

## Root Level
- `package.json` - Root package with Docker Compose scripts
- `docker-compose.yml` - Multi-container orchestration
- `README.md` - Comprehensive project documentation
- `HERB_IMPORT_GUIDE.md` - Data import procedures and compliance

## Backend (`/backend`)
```
backend/
├── server.js              # Express server entry point
├── package.json           # Backend dependencies and scripts
├── Dockerfile             # Backend container configuration
├── config/
│   └── database.js        # PostgreSQL connection pool
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── routes/                # API route handlers
├── scripts/               # Organized database and data management scripts
│   ├── database/          # Database schema and management
│   │   ├── migrate.js     # Main database schema creation
│   │   ├── cleanup.js     # Clean transactional data
│   │   └── migrations/    # Individual schema migrations
│   ├── data/              # Data import and management
│   │   ├── import-herbs.js # Core herb data importer
│   │   ├── cloud-import.js # Cloud-based data import
│   │   └── generators/    # Data generation scripts
│   ├── seed/              # Test data and seeding
│   │   ├── seed-users.js  # Create test users
│   │   ├── seed-suppliers-with-pricing.js # Create suppliers
│   │   └── demo/          # Demo data for presentations
│   ├── setup/             # Orchestration and setup
│   │   └── setup-foundation.js # Complete system setup
│   └── README.md          # Scripts documentation
└── data/                  # Static herb data files (JSON)
```

## Frontend (`/frontend`)
```
frontend/
├── package.json           # Frontend dependencies
├── Dockerfile             # Frontend container configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── public/
│   └── index.html         # HTML template
└── src/
    ├── App.js             # Main application component
    ├── index.js           # React entry point
    ├── index.css          # Global styles with Tailwind
    ├── components/        # Reusable UI components
    │   ├── Navbar.js      # Navigation component
    │   ├── HerbAutocomplete.js    # Bilingual herb search
    │   └── HerbDualInput.js       # English/Chinese input
    ├── contexts/          # React context providers
    │   └── AuthContext.js # Authentication state management
    └── pages/             # Route-based page components
        ├── Login.js
        ├── Register.js
        ├── PractitionerDashboard.js
        ├── SupplierDashboard.js
        ├── CreatePrescription.js
        ├── Orders.js
        ├── Inventory.js
        └── SupplierComparison.js
```

## Key Conventions

### File Naming
- React components: PascalCase (e.g., `CreatePrescription.js`)
- Backend modules: camelCase (e.g., `database.js`)
- Scripts: kebab-case (e.g., `seed-users.js`)
- Data files: kebab-case with descriptive names

### Component Organization
- Pages in `/pages` for route-based components
- Reusable components in `/components`
- Context providers in `/contexts`
- One component per file with default export

### API Structure
- RESTful routes organized by resource (`/api/auth`, `/api/prescriptions`)
- Middleware for authentication and validation
- Database queries in route handlers (no separate model layer)

### Database Scripts
- **database/**: Schema management and migrations
- **seed/**: Test data and user seeding with realistic pricing
- **data/**: Herb data import with Hong Kong compliance and cloud capabilities
- **setup/**: Complete system orchestration and foundation setup

### Bilingual Support
- Chinese herb names stored alongside English names
- Autocomplete components support both languages
- Data files include Traditional Chinese characters (繁體中文)
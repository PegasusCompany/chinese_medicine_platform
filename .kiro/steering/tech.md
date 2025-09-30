# Technology Stack

## Architecture
Full-stack web application with containerized microservices architecture using Docker Compose.

## Frontend
- **React 18.2** - Component-based UI with functional components and hooks
- **React Router DOM 6.15** - Client-side routing
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **Headless UI** - Accessible UI components
- **Heroicons** - Icon library
- **Axios** - HTTP client for API communication
- **React Hook Form** - Form handling and validation

## Backend
- **Node.js + Express 4.18** - RESTful API server
- **PostgreSQL 15** - Primary database
- **JWT** - Authentication and authorization
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Express Validator** - Input validation

## Database
- **PostgreSQL 15** with connection pooling
- Pre-loaded with 127+ Hong Kong approved herbs
- Role-based user system (practitioners/suppliers)
- Complete order lifecycle tracking

## Development Tools
- **Docker & Docker Compose** - Containerization
- **Nodemon** - Backend development server
- **React Scripts** - Frontend build tools

## Common Commands

### Development
```bash
# Start full application stack
npm run dev

# Stop all services
npm run down

# Clean restart (removes volumes)
npm run clean
```

### Backend Operations
```bash
# Database migration
docker-compose exec backend npm run migrate

# Seed users
docker-compose exec backend npm run seed

# Import herbs data
docker-compose exec backend npm run import-herbs

# Import Hong Kong herbs
docker-compose exec backend npm run import-hk-herbs
```

### Access Points
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001
- PostgreSQL: localhost:5432

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV` - Environment (development/production)
- `REACT_APP_API_URL` - Frontend API endpoint
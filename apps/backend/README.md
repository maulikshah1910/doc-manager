# Backend API - Document Management Platform

NestJS-based backend API with JWT authentication, RBAC authorization, and MySQL database integration.

## Features

- JWT-based authentication with access and refresh tokens
- Role-Based Access Control (RBAC) with database-driven permissions
- MySQL database with TypeORM
- Secure password hashing with bcryptjs
- httpOnly cookies for refresh token storage
- Global authentication and permission guards
- CORS enabled for frontend integration

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript (strict mode)
- **Database**: MySQL 8.0+
- **ORM**: TypeORM
- **Authentication**: JWT (passport-jwt)
- **Validation**: class-validator, class-transformer

## Installation

\`\`\`bash
# From the backend directory
cd apps/backend

# Install dependencies
npm install
\`\`\`

## Running the Application

### Development Mode

\`\`\`bash
npm run start:dev
\`\`\`

API available at `http://localhost:4000`

### Production Mode

\`\`\`bash
npm run build
npm run start:prod
\`\`\`

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/verify` - Verify JWT token

### Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | password123 | Super Admin |
| manager@example.com | password123 | Manager |
| employee@example.com | password123 | Employee |

## Documentation

For complete documentation, see:
- [Main README](../../README.md)
- [Development Guide](../../DEVELOPMENT.md)


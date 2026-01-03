# Development Guide

Complete guide for developing the Internal Document Management Platform. This document contains architecture decisions, constraints, setup instructions, and development guidelines.

**Audience:** Developers and AI assistants working on this project.

---

## Table of Contents

1. [Architecture & Constraints](#architecture--constraints)
2. [Technology Stack & Rationale](#technology-stack--rationale)
3. [Database Setup](#database-setup)
4. [RBAC & Authorization](#rbac--authorization)
5. [API Design Standards](#api-design-standards)
6. [Frontend Guidelines](#frontend-guidelines)
7. [File Storage](#file-storage)
8. [Testing Strategy](#testing-strategy)
9. [Common Pitfalls](#common-pitfalls)

---

## Architecture & Constraints

### Core Principles (NON-NEGOTIABLE)

1. **Single Organization Only** - NOT multi-tenant SaaS
   - ❌ No `organization_id`, `tenant_id`, or workspace fields
   - ✅ All users belong to same organization implicitly

2. **Backend-Enforced Security** - Frontend is UI-only
   - ❌ No authorization logic in frontend
   - ❌ No business calculations in frontend
   - ✅ Backend validates everything (auth, permissions, data)

3. **Database-Driven RBAC** - Permissions are data, not code
   - ❌ No hardcoded permission enums
   - ❌ No role name checks: `if (user.role === 'admin')`
   - ✅ Permission checks via guards: `@RequirePermissions('document.upload')`

4. **Audit by Default** - All mutations logged
   - ❌ Cannot update or delete audit logs
   - ✅ Every CREATE/UPDATE/DELETE generates audit entry
   - ✅ Audit logs are append-only

5. **Versioned Document Storage** - Never overwrite files
   - ❌ No file overwrites or hard deletes
   - ✅ New uploads create new versions
   - ✅ Storage structure: `{doc_id}/v{version}/file.ext`

6. **Soft Deletes Only** - Deletion is recoverable
   - ❌ No hard deletes (`DELETE FROM table`)
   - ✅ Use `deleted_at TIMESTAMP NULL`
   - ✅ Filter queries: `WHERE deleted_at IS NULL`

### Phase-1 Exclusions

**The following are FORBIDDEN in Phase-1:**

- ❌ AI/GenAI features (vector DBs, embeddings, RAG, chatbots)
- ❌ Multi-organization/multi-tenant support
- ❌ External storage (S3, GCS, Azure Blob)
- ❌ Social login (OAuth, SAML, SSO)
- ❌ Real-time features (WebSockets, SSE)
- ❌ Email notifications
- ❌ Public API access

---

## Technology Stack & Rationale

### Backend: NestJS

**Why?**
- Built-in dependency injection
- Decorator-based RBAC guards
- TypeScript-first with excellent type safety
- Modular structure scales well

**Requirements:**
- Use NestJS decorators (`@Injectable`, `@Controller`, `@Module`)
- TypeScript strict mode enabled
- No `any` types (use `unknown` if needed)

### Frontend: Next.js (App Router)

**Why?**
- Server-side rendering for better performance
- React Server Components reduce bundle size
- File-based routing simplifies navigation

**Requirements:**
- Use App Router (NOT Pages Router)
- Default to Server Components
- Use Client Components only for interactivity

### Database: MySQL 8.0+

**Why?**
- Relational model fits RBAC perfectly
- ACID transactions ensure data integrity
- Team expertise with MySQL

**Requirements:**
- All schema changes via migrations
- Use TypeORM for queries
- No raw SQL with user input (SQL injection prevention)

### Authentication: JWT

**Why?**
- Stateless authentication scales horizontally
- Access token in Authorization header
- Refresh token rotation for security

**Implementation:**
- Access token expiry: 15 minutes
- Refresh token expiry: 7 days
- Refresh token in httpOnly cookie (XSS protection)
- Access token in memory (frontend)

---

## Database Setup

### Deployment Modes

The database setup supports **three deployment modes**:

1. **Local MySQL** - MySQL installed directly on your machine
2. **Docker MySQL** - MySQL running in a Docker container
3. **Remote MySQL** - AWS RDS, Cloud SQL, or any remote MySQL instance

### Configuration

Set your deployment mode in `.env`:

```bash
# Set to 'true' for Docker, 'false' for local MySQL or RDS
USE_DOCKER=false

DB_HOST=localhost              # Or your RDS endpoint
DB_PORT=3306
DB_DATABASE=doc_manager
DB_USER=root
DB_PASSWORD=your_password
DB_ROOT_PASSWORD=your_password

# Docker container name (only used when USE_DOCKER=true)
DB_CONTAINER_NAME=doc-manager-mysql
```

### Quick Start

**Local MySQL:**
```bash
# 1. Ensure MySQL is running
mysql -h localhost -u root -p -e "SELECT 1;"

# 2. Create environment file
cp .env.sample .env

# 3. Set USE_DOCKER=false in .env

# 4. Run migrations
npm run db:migrate

# 5. Verify setup
npm run db:migrate:status
```

**Docker MySQL:**
```bash
# 1. Create environment file
cp .env.sample .env

# 2. Set USE_DOCKER=true in .env

# 3. Run automated setup
npm run db:setup

# 4. Verify setup
npm run db:migrate:status
```

**Remote MySQL (RDS/Cloud):**
```bash
# 1. Create environment file and configure
cp .env.sample .env

# 2. Set your RDS endpoint in .env:
USE_DOCKER=false
DB_HOST=myapp.xyz.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=secure_password

# 3. Ensure database exists on RDS, then run migrations
npm run db:migrate

# 4. Verify setup
npm run db:migrate:status
```

### MySQL Connection

**From Host Machine (Local/RDS):**
```bash
mysql -h localhost -P 3306 -u root -p doc_manager
```

**From Docker:**
```bash
docker exec -it doc-manager-mysql mysql -u root -p doc_manager
```

**From Backend (NestJS):**
```typescript
{
  type: 'mysql',
  host: process.env.DB_HOST,     // 'mysql' for Docker, 'localhost' for local, or RDS endpoint
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  synchronize: false,              // Use migrations, not auto-sync
}
```

### Migration Commands

| Command | Description |
|---------|-------------|
| `./infra/scripts/migrate.sh up` | Run pending migrations |
| `./infra/scripts/migrate.sh down` | Rollback last batch |
| `./infra/scripts/migrate.sh status` | Show migration state |
| `./infra/scripts/migrate.sh fresh` | Drop all & re-run (dev only) |

### Migration File Structure

Every migration has TWO files:

**Forward:** `YYYYMMDD_NNN_description.sql`
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

**Rollback:** `YYYYMMDD_NNN_rollback_description.sql`
```sql
DROP TABLE IF EXISTS users;
```

### Troubleshooting

**Local MySQL Connection Issues:**
```bash
# Test connection
mysql -h localhost -u root -p -e "SELECT 1;"

# Check MySQL is running
ps aux | grep mysql

# Verify environment variables
cat .env | grep DB_
```

**Docker Issues:**
```bash
# Check container is running
docker ps | grep mysql

# View container logs
docker-compose logs -f mysql

# Restart container
docker-compose restart mysql
```

**Remote MySQL (RDS) Issues:**
```bash
# Test connection with full details
mysql -h your-endpoint.rds.amazonaws.com -P 3306 -u admin -p -e "SELECT 1;"

# Check:
# - Security group/firewall rules allow port 3306
# - RDS is publicly accessible (if connecting from outside VPC)
# - VPC settings are correct
# - Database user has proper permissions
```

**Switching Between Modes:**

To switch from one mode to another:
1. Update `USE_DOCKER` in `.env`
2. Update connection details (`DB_HOST`, `DB_USER`, etc.)
3. Run migrations in the new environment

Example - Switching from Local to RDS:
```bash
# Update .env
USE_DOCKER=false
DB_HOST=myapp.xyz.rds.amazonaws.com
DB_USER=admin
DB_PASSWORD=secure_password

# Run migrations on RDS
npm run db:migrate
```

### Current Database Schema

**Users Table:**
```sql
users (
    id              BIGINT UNSIGNED PK AUTO_INCREMENT
    first_name      VARCHAR(100) NOT NULL
    last_name       VARCHAR(100) NOT NULL
    email           VARCHAR(255) NOT NULL UNIQUE
    password        VARCHAR(255) NOT NULL (bcrypt hashed)
    profile_image   VARCHAR(500) NULL
    status          ENUM('active','inactive','suspended','pending')
    created_at      TIMESTAMP
    updated_at      TIMESTAMP
    deleted_at      TIMESTAMP NULL
)
```

---

## RBAC & Authorization

### Overview

The system implements comprehensive Role-Based Access Control with:
- **One Role Per User**: Simplified permission management (each user has exactly ONE role)
- **Granular Permissions**: Fine-grained permissions for different modules
- **Role-Permission Mapping**: Flexible many-to-many relationship between roles and permissions
- **Pre-defined Roles**: Five default roles with appropriate permission sets

### Database Schema

```
users → roles → role_permissions → permissions
```

**Tables:**

```sql
-- Roles table
roles (
    id              BIGINT UNSIGNED PK AUTO_INCREMENT
    name            VARCHAR(50) NOT NULL UNIQUE
    display_name    VARCHAR(100) NOT NULL
    description     TEXT NULL
    is_active       BOOLEAN DEFAULT TRUE
    created_at      TIMESTAMP
    updated_at      TIMESTAMP
)

-- Permissions table
permissions (
    id              BIGINT UNSIGNED PK AUTO_INCREMENT
    name            VARCHAR(100) NOT NULL UNIQUE
    display_name    VARCHAR(150) NOT NULL
    description     TEXT NULL
    module          VARCHAR(50) NOT NULL
    is_active       BOOLEAN DEFAULT TRUE
    created_at      TIMESTAMP
    updated_at      TIMESTAMP
)

-- Junction table (many-to-many)
role_permissions (
    id              BIGINT UNSIGNED PK AUTO_INCREMENT
    role_id         BIGINT UNSIGNED FK → roles.id (CASCADE)
    permission_id   BIGINT UNSIGNED FK → permissions.id (CASCADE)
    created_at      TIMESTAMP
    UNIQUE (role_id, permission_id)
)

-- Users table (updated)
users (
    ...
    role_id         BIGINT UNSIGNED FK → roles.id (SET NULL)
    ...
)
```

**Key Constraints:**
- Each user has exactly ONE role (enforced by schema: single `role_id` column)
- Deleting a role cascades to `role_permissions` and sets user `role_id` to NULL
- Unique constraint on `(role_id, permission_id)` prevents duplicate assignments

### Default Roles & Permissions

| Role | ID | Permissions | Use Case |
|------|-----|-------------|----------|
| **Super Admin** | 1 | 31 (ALL) | System administrators, platform owners |
| **Admin** | 2 | 22 | IT administrators (excludes role/permission management) |
| **Manager** | 3 | 15 | Department managers, team leads |
| **Employee** | 4 | 7 | Regular employees |
| **Viewer** | 5 | 3 | External stakeholders, read-only users |

### Permission Modules

**Documents Module (10 permissions):**
- `documents.view` - View documents
- `documents.view_all` - View all documents in system
- `documents.create` - Create new documents
- `documents.edit` - Edit own documents
- `documents.edit_all` - Edit any document
- `documents.delete` - Delete own documents
- `documents.delete_all` - Delete any document
- `documents.share` - Share documents with others
- `documents.approve` - Approve/reject documents
- `documents.download` - Download documents

**Users Module (6 permissions):**
- `users.view` - View user profiles
- `users.create` - Create new users
- `users.edit` - Edit user information
- `users.delete` - Delete user accounts
- `users.manage_roles` - Assign roles to users
- `users.suspend` - Suspend/activate accounts

**Roles Module (4 permissions):**
- `roles.view` - View roles
- `roles.create` - Create new roles
- `roles.edit` - Edit existing roles
- `roles.delete` - Delete roles

**Permissions Module (2 permissions):**
- `permissions.view` - View all permissions
- `permissions.manage` - Assign permissions to roles

**Reports Module (4 permissions):**
- `reports.view` - View reports
- `reports.view_all` - View all system reports
- `reports.create` - Create custom reports
- `reports.export` - Export reports

**Settings Module (2 permissions):**
- `settings.view` - View system settings
- `settings.edit` - Modify system settings

**Audit Module (2 permissions):**
- `audit.view` - View audit logs
- `audit.export` - Export audit logs

### Permission Naming Convention

Format: `module.action`

**Actions:**
- `view` - View own or assigned resources
- `view_all` - View all resources in system
- `create` - Create new resources
- `edit` - Edit own resources
- `edit_all` - Edit any resource
- `delete` - Delete own resources
- `delete_all` - Delete any resource
- `manage` - Full management capability
- `approve` - Approval workflow
- `share` - Sharing capability
- `download` - Download capability
- `export` - Export capability

### Default Test Users

| Email | Name | Role | Password | Permissions |
|-------|------|------|----------|-------------|
| admin@example.com | Admin User | Super Admin | password123 | 31 |
| maulik@example.com | Maulik Shah | Super Admin | password123 | 31 |
| manager@example.com | Manager User | Manager | password123 | 15 |
| employee@example.com | Employee User | Employee | password123 | 7 |
| john.doe@example.com | John Doe | Employee | password123 | 7 |
| jane.smith@example.com | Jane Smith | Viewer | password123 | 3 |

**⚠️ Change default passwords in production!**

### JWT Payload Structure

**Access Token:**
```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "role": {
    "id": 3,
    "name": "manager"
  },
  "permissions": [
    "documents.view",
    "documents.view_all",
    "documents.create",
    "documents.edit",
    "documents.edit_all",
    "documents.delete",
    "documents.share",
    "documents.approve",
    "documents.download"
  ],
  "iat": 1735737600,
  "exp": 1735738500
}
```

**Refresh Token:**
```json
{
  "sub": "user-123",
  "sessionId": "session-abc-456",
  "iat": 1735737600,
  "exp": 1736342400
}
```

### Permission Guard Implementation

**Backend (NestJS):**
```typescript
@Controller('documents')
export class DocumentsController {
  @Post()
  @RequirePermissions('documents.create')
  async uploadDocument(@Body() dto: UploadDocumentDto) {
    return this.documentsService.upload(dto);
  }

  @Delete(':id')
  @RequirePermissions('documents.delete')
  async deleteDocument(@Param('id') id: string, @CurrentUser() user: User) {
    // Additional check: Can only delete own documents unless has documents.delete_all
    const hasDeleteAll = user.permissions.includes('documents.delete_all');
    if (!hasDeleteAll) {
      const document = await this.documentsService.findOne(id);
      if (document.uploaded_by !== user.id) {
        throw new ForbiddenException('Cannot delete documents of other users');
      }
    }
    return this.documentsService.delete(id);
  }
}
```

**Permission Check Helper:**
```typescript
async function checkPermission(userId: number, permission: string): Promise<boolean> {
  const result = await db.query(`
    SELECT EXISTS(
      SELECT 1
      FROM users u
      JOIN roles r ON u.role_id = r.id AND r.is_active = TRUE
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id AND p.is_active = TRUE
      WHERE u.id = ? AND p.name = ?
    ) as has_permission
  `, [userId, permission]);

  return result.has_permission === 1;
}
```

**Frontend (Permission-based UI):**
```typescript
'use client';

export function DocumentActions({ documentId }) {
  const permissions = usePermissions();

  return (
    <div>
      {hasPermission(permissions, 'documents.view') && (
        <button onClick={() => download(documentId)}>Download</button>
      )}

      {hasPermission(permissions, 'documents.delete') && (
        <button onClick={() => deleteDoc(documentId)}>Delete</button>
      )}
    </div>
  );
}
```

**IMPORTANT:** Frontend permission checks are UI-only (UX optimization). Backend ALWAYS validates permissions.

### Common Queries

**Get User's Permissions:**
```sql
SELECT p.name, p.display_name, p.module
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.email = 'admin@example.com'
ORDER BY p.module, p.name;
```

**Check Specific Permission:**
```sql
SELECT EXISTS(
    SELECT 1
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.email = 'manager@example.com'
    AND p.name = 'documents.approve'
) as has_permission;
```

**Assign Role to User:**
```sql
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'manager')
WHERE email = 'newuser@example.com';
```

**Add Permission to Role:**
```sql
INSERT INTO role_permissions (role_id, permission_id)
VALUES (
    (SELECT id FROM roles WHERE name = 'manager'),
    (SELECT id FROM permissions WHERE name = 'documents.delete_all')
);
```

### RBAC Setup

**Run Migrations:**
```bash
npm run db:migrate
```

This creates:
1. `roles` table
2. `permissions` table
3. `role_permissions` junction table
4. Adds `role_id` to `users` table

**Seed RBAC Data:**
```bash
npm run db:seed
```

This populates:
1. Default roles (Super Admin, Admin, Manager, Employee, Viewer)
2. 31 permissions across 7 modules
3. Role-permission mappings
4. Test users with assigned roles

**Verify Setup:**
```bash
# Check migration status
npm run db:migrate:status

# List seed files
npm run db:seed list
```

### Best Practices

**1. One Role Per User:**
- Keep the "one role per user" constraint to avoid complexity
- If users need different permission sets, create specialized roles
- Example: Instead of assigning both 'manager' and 'auditor', create a 'manager_auditor' role

**2. Permission Checks:**
```typescript
// ❌ WRONG - Checking role name
if (user.role.name === 'admin') {
  allowAccess();
}

// ✅ CORRECT - Checking permission
@RequirePermissions('documents.delete')
deleteDocument() {
  // Permission guard handles authorization
}
```

**3. Role Management:**
- Avoid deleting roles that have users assigned
- Use `is_active = FALSE` to disable roles instead
- Document role purposes clearly in the description field

**4. Permission Management:**
- Group related permissions by module
- Use `is_active = FALSE` to deprecate permissions
- Document what each permission grants in the description

**5. Security:**
- Regularly audit role-permission mappings
- Review user role assignments periodically
- Log all role and permission changes
- Implement backend permission checks, not just UI hiding

### Troubleshooting

**User has no permissions:**
1. Check if user has a role: `SELECT role_id FROM users WHERE id = ?`
2. Check if role is active: `SELECT is_active FROM roles WHERE id = ?`
3. Check role-permission mappings: `SELECT * FROM role_permissions WHERE role_id = ?`

**Permission not working:**
1. Verify permission exists: `SELECT * FROM permissions WHERE name = ?`
2. Check if permission is active
3. Verify role has permission: `SELECT * FROM role_permissions WHERE permission_id = ?`

**Need to reset:**
```bash
# Drop all tables and re-run migrations
npm run db:migrate fresh

# Then seed
npm run db:seed
```

---

## API Design Standards

### RESTful Endpoints

```
# Collection operations
GET    /api/v1/documents           → List documents (paginated)
POST   /api/v1/documents           → Upload document

# Resource operations
GET    /api/v1/documents/{id}      → Get document metadata
PATCH  /api/v1/documents/{id}      → Update metadata
DELETE /api/v1/documents/{id}      → Soft delete

# Sub-resources
GET    /api/v1/documents/{id}/versions
GET    /api/v1/documents/{id}/download

# Authentication
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

### Response Format

**Success:**
```json
{
  "data": {
    "id": "abc-123",
    "title": "Employee Handbook"
  },
  "meta": {
    "timestamp": "2026-01-01T12:00:00Z"
  }
}
```

**List (with pagination):**
```json
{
  "data": [
    { "id": "doc-1", "title": "..." },
    { "id": "doc-2", "title": "..." }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email: must be a valid email",
    "password: must be at least 8 characters"
  ],
  "timestamp": "2026-01-01T12:00:00Z"
}
```

### HTTP Status Codes

| Code | Use Case |
|------|----------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (lacks permission) |
| 404 | Not Found |
| 409 | Conflict (email already exists) |
| 422 | Unprocessable Entity (business rule violation) |
| 500 | Internal Server Error |

**Never expose in errors:**
- Stack traces (production)
- Database error details
- Internal file paths
- Secrets or tokens

### Pagination

**Query Parameters:**
```
GET /api/v1/documents?page=2&limit=20&sort=created_at&order=desc
```

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Field to sort by (default: `created_at`)
- `order`: `asc` or `desc` (default: `desc`)

---

## Frontend Guidelines

### Server vs Client Components

**Server Components (Default):**
- Data fetching from backend API
- Static layouts and pages
- No user interactivity

**Client Components (`'use client'`):**
- Forms with input fields
- Click handlers, event listeners
- State management (`useState`, `useReducer`)
- Browser APIs

**Example:**
```typescript
// app/documents/page.tsx (Server Component)
export default async function DocumentsPage() {
  const documents = await fetch('http://backend/api/v1/documents')
    .then(r => r.json());

  return (
    <div>
      <h1>Documents</h1>
      <DocumentList documents={documents.data} />
      <UploadButton />  {/* Client Component */}
    </div>
  );
}

// components/upload-button.tsx (Client Component)
'use client';

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  return <button onClick={() => setIsOpen(true)}>Upload</button>;
}
```

### API Client

**Centralized client with interceptors:**

```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000
});

// Add access token to requests
apiClient.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data } = await axios.post('/api/v1/auth/refresh');
      setAccessToken(data.accessToken);
      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(error.config);
    }
    return Promise.reject(error);
  }
);
```

### State Management

| State Type | Storage | Example |
|------------|---------|---------|
| Server state | Fetch from API | Document list, user profile |
| UI state | `useState` | Modal open/closed, form inputs |
| Global UI state | React Context | Theme, sidebar collapsed |
| Auth state | Memory + httpOnly cookie | Access token, user info |

**Avoid:** Redux/MobX in Phase-1 (overkill for this scope)

---

## File Storage

### Upload Flow

1. Frontend sends multipart/form-data
2. Backend validates file size (<50MB)
3. Backend validates MIME type from content
4. Backend generates UUID for document
5. Backend creates directory: `/storage/documents/{uuid}/v1/`
6. Backend saves file
7. Backend creates database records
8. Backend logs upload to audit table
9. Backend returns document metadata

**Implementation:**
```typescript
@Post()
@UseInterceptors(FileInterceptor('file'))
@RequirePermissions('document.upload')
async uploadDocument(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadDocumentDto,
  @CurrentUser() user: User
) {
  this.validateFileSize(file);
  this.validateMimeType(file);

  const documentId = uuid();
  const filePath = await this.storageService.save(documentId, 1, file);

  const document = await this.documentsService.create({
    id: documentId,
    title: dto.title,
    uploaded_by: user.id
  });

  await this.auditService.log({
    user_id: user.id,
    action: 'CREATE',
    resource_type: 'document',
    resource_id: documentId
  });

  return { data: document };
}
```

### Download Flow

1. Frontend requests `/api/v1/documents/{id}/download`
2. Backend validates `document.view` permission
3. Backend fetches file path from database
4. Backend logs access to audit table
5. Backend streams file with headers

**Implementation:**
```typescript
@Get(':id/download')
@RequirePermissions('document.view')
async downloadDocument(
  @Param('id') id: string,
  @CurrentUser() user: User,
  @Res() response: Response
) {
  const document = await this.documentsService.findOne(id);
  const version = await this.documentVersionsService.findVersion(id, document.current_version);

  await this.auditService.log({
    user_id: user.id,
    action: 'ACCESS',
    resource_type: 'document',
    resource_id: id
  });

  const fileStream = createReadStream(version.file_path);
  response.set({
    'Content-Type': version.mime_type,
    'Content-Disposition': `attachment; filename="${version.filename}"`,
    'Content-Length': version.file_size
  });

  fileStream.pipe(response);
}
```

### Security

**Filename Sanitization:**
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')         // Remove ".."
    .replace(/[\/\\]/g, '')       // Remove slashes
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}
```

**MIME Type Validation:**
```typescript
async function validateMimeType(file: Express.Multer.File) {
  const detectedType = await fileType.fromBuffer(file.buffer);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'text/plain'
  ];

  if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
    throw new BadRequestException('Invalid file type');
  }
}
```

---

## Testing Strategy

### Coverage Requirements

- Backend services: 80%
- Backend controllers: 70%
- Frontend components: 50%

### Backend Testing

**Unit Tests:**
```typescript
describe('DocumentsService', () => {
  it('should create a document', async () => {
    const dto = { title: 'Test Doc', uploadedBy: 'user-123' };
    const result = await service.create(dto);
    expect(result.title).toBe('Test Doc');
  });
});
```

**Integration Tests:**
```typescript
describe('DocumentsController (e2e)', () => {
  it('POST /documents - should upload document', () => {
    return request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', './test/fixtures/test.pdf')
      .field('title', 'Test Document')
      .expect(201);
  });

  it('should return 403 without permission', () => {
    return request(app.getHttpServer())
      .delete('/api/v1/documents/doc-123')
      .set('Authorization', `Bearer ${tokenWithoutPermission}`)
      .expect(403);
  });
});
```

---

## Common Pitfalls

### ❌ DON'T: Check Role Names

```typescript
// WRONG
if (user.role.name === 'admin') {
  allowAccess();
}

// CORRECT
@RequirePermissions('document.delete')
deleteDocument() {
  // Permission guard handles authorization
}
```

### ❌ DON'T: Put Business Logic in Frontend

```typescript
// WRONG (Frontend)
const total = items.reduce((sum, item) =>
  sum + (item.price * item.quantity * (1 - item.discount)), 0
);

// CORRECT (Backend endpoint)
GET /api/v1/cart/total → { "total": 99.99 }
```

### ❌ DON'T: Store Tokens in localStorage

```typescript
// WRONG
localStorage.setItem('refreshToken', token);  // Vulnerable to XSS

// CORRECT
response.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

### ❌ DON'T: Hard Delete

```typescript
// WRONG
await this.documentsRepository.delete(id);

// CORRECT
await this.documentsRepository.update(id, { deleted_at: new Date() });
```

---

## Environment Configuration

### Required Variables (`.env.sample`)

```bash
# Database
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=doc_manager
DB_USER=doc_user
DB_PASSWORD=CHANGE_ME

# JWT
JWT_SECRET=CHANGE_ME_RANDOM_SECRET
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Storage
STORAGE_PATH=/app/storage/documents
MAX_FILE_SIZE=52428800

# URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4000

# Environment
NODE_ENV=development
```

---

## Quick Decision Framework

Before implementing ANY feature, ask:

1. ✅ Does it violate constraints? → **REJECT if yes**
2. ✅ Is it on Phase-1 Exclusion list? → **DEFER if yes**
3. ✅ Where does logic belong? → **Backend if business logic**
4. ✅ What permissions needed? → **Add to database first**
5. ✅ Does it change schema? → **Create migration first**
6. ✅ How to test? → **Unit + integration tests**

**When in doubt:**
- Security enforcement → Backend
- UI rendering → Frontend
- Data transformation → Backend
- User interaction → Frontend
- RBAC checks → Permission guards (never role names)

---

## Document Maintenance

**Version:** 1.0.0 (Phase-1)
**Last Updated:** 2026-01-03
**Audience:** Developers and AI assistants

For project overview and repository structure, see [README.md](README.md).

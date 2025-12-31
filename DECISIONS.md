# Architectural Decisions & Implementation Rules

## Document Purpose

This document provides **implementation guidance** and **decision-making rules** for day-to-day development. While [CONSTRAINTS.md](CONSTRAINTS.md) defines what you **cannot do**, this document guides what you **should do** and **how to do it**.

**When to reference this document**: During feature implementation, code reviews, and when choosing between multiple valid approaches.

---

## 1. Decision Framework

### 1.1 Feature Evaluation Process

When evaluating a new feature request, follow this decision tree:

```
1. Does it violate CONSTRAINTS.md?
   YES → Reject immediately
   NO → Continue

2. Is it on Phase-1 Exclusion list?
   YES → Defer to future phase
   NO → Continue

3. Is it clearly defined?
   NO → Ask clarifying questions
   YES → Continue

4. Where does the logic belong?
   - Data validation/transformation → Backend
   - UI rendering/interactivity → Frontend
   - State changes → Backend
   - UI state only → Frontend

5. Does it require new permissions?
   YES → Add to permissions table first
   NO → Use existing permissions

6. Does it affect security?
   YES → Security review required
   NO → Standard review

7. Does it change database schema?
   YES → Create migration first
   NO → Proceed with implementation

8. Proceed with implementation
```

### 1.2 Implementation Priority Order

**Recommended development sequence**:

1. **Database Layer**: Schema, migrations, seed data
2. **Backend Core**: Authentication, RBAC guards
3. **Backend Features**: User/role/document services
4. **API Layer**: Controllers, DTOs, validation
5. **Frontend Layout**: Pages, routing, navigation
6. **Frontend Components**: UI components, forms
7. **Integration**: Connect frontend to backend APIs
8. **Testing**: Unit and integration tests
9. **Audit & Logging**: Ensure all mutations logged

---

## 2. Technology Choices & Rationale

### 2.1 Why NestJS for Backend?

**Decision**: Use NestJS as backend framework

**Rationale**:
- Built-in dependency injection (clean architecture)
- Decorator-based guards for RBAC enforcement
- TypeScript-first with excellent type safety
- Modular structure scales well
- Strong ecosystem for enterprise features

**Alternatives Considered**:
- Express: Too minimal, requires manual architecture
- Fastify: Performance gains not needed for internal tool
- tRPC: Couples frontend/backend too tightly

**Trade-offs Accepted**:
- Steeper learning curve than Express
- More opinionated structure (benefit for this use case)

---

### 2.2 Why Next.js for Frontend?

**Decision**: Use Next.js with App Router

**Rationale**:
- Server-side rendering for internal tools (better performance)
- React Server Components reduce client bundle size
- File-based routing simplifies navigation
- API routes available (not used; backend handles all APIs)

**Alternatives Considered**:
- Vite + React: No SSR, loses SEO benefits (minor for internal tool)
- Remix: Smaller ecosystem, less mature
- SvelteKit: Team unfamiliar with Svelte

**Trade-offs Accepted**:
- App Router still evolving (some patterns not settled)
- Larger framework than needed (acceptable for this scope)

---

### 2.3 Why MySQL?

**Decision**: Use MySQL 8.0+ as primary database

**Rationale**:
- Relational model fits RBAC and document metadata perfectly
- ACID transactions ensure data integrity
- Mature, well-understood technology
- Team expertise with MySQL
- Foreign key constraints enforce referential integrity

**Alternatives Considered**:
- PostgreSQL: Slightly more features, but MySQL sufficient
- MongoDB: NoSQL doesn't fit relational RBAC model
- SQLite: Not suitable for multi-user concurrent access

**Trade-offs Accepted**:
- No advanced PostgreSQL features (JSONB queries, full-text search)
- Phase-2 may add vector DB alongside MySQL (hybrid approach)

---

### 2.4 Why JWT (Not Session Cookies)?

**Decision**: Use JWT with access + refresh tokens

**Rationale**:
- Stateless authentication scales horizontally
- Frontend/backend can be deployed separately
- Access token in Authorization header (better for APIs)
- Refresh token rotation provides security

**Alternatives Considered**:
- Session cookies: Requires session store, harder to scale
- OAuth2: Overkill for single-org internal tool

**Trade-offs Accepted**:
- Cannot revoke access tokens before expiry (mitigated by 15min expiry)
- Refresh tokens stored in DB (hybrid stateless/stateful approach)

**Implementation Details**:
- Access token expiry: 15 minutes (short to limit exposure)
- Refresh token expiry: 7 days (balance security and UX)
- Refresh token stored in httpOnly cookie (prevents XSS)
- Access token in memory (frontend) to prevent XSS theft

---

### 2.5 Why Local File Storage (Phase-1)?

**Decision**: Store files on local file system in Phase-1

**Rationale**:
- Simplest implementation for MVP
- No external dependencies or costs
- Sufficient for single-server deployment
- Easy to migrate to S3/GCS in future

**Alternatives Considered**:
- S3/GCS: Adds complexity, not needed yet
- Database BLOBs: Poor performance, bloats database

**Trade-offs Accepted**:
- Not horizontally scalable (Phase-1 single server)
- Requires volume backup strategy
- Future migration to object storage planned

**Future Path**:
- Abstract file service interface now
- Swap implementation to S3 in Phase-2 without API changes

---

## 3. Database Design Decisions

### 3.1 User-Role-Permission Model

**Decision**: Many-to-many relationships for users↔roles↔permissions

**Schema**:
```
users (id, email, password_hash, created_at, deleted_at)
  ↓ (many-to-many)
user_roles (user_id, role_id)
  ↓
roles (id, name, is_system, description)
  ↓ (many-to-many)
role_permissions (role_id, permission_id)
  ↓
permissions (id, key, description)
```

**Rationale**:
- Flexible: Users can have multiple roles
- Extensible: Permissions added via data, not code
- Queryable: Can list all permissions for a user efficiently
- Auditable: Role changes tracked in user_roles

**Alternative Considered**:
- Single role per user: Too restrictive (user might be both Manager + HR)

---

### 3.2 Document Versioning Model

**Decision**: Separate documents and document_versions tables

**Schema**:
```
documents (id UUID, current_version, uploaded_by, created_at, deleted_at)
  ↓ (one-to-many)
document_versions (id, document_id, version, file_path, file_size, mime_type, uploaded_at)
```

**Rationale**:
- Immutable versions: Old versions never change
- Clear history: Easy to query version timeline
- Efficient queries: `current_version` pointer avoids MAX(version) queries
- Storage path in DB: File location explicitly tracked

**Implementation Rules**:
- `documents.current_version` updated on new upload
- `version` auto-increments per document (1, 2, 3...)
- `file_path` stores full path: `/storage/documents/{doc_id}/v{version}/filename.ext`

---

### 3.3 Audit Log Structure

**Decision**: Single audit_logs table with JSON metadata

**Schema**:
```sql
CREATE TABLE audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action ENUM('CREATE', 'UPDATE', 'DELETE', 'ACCESS') NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100) NOT NULL,
  metadata JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at)
);
```

**Rationale**:
- Single table: Easy to query all activity
- JSON metadata: Flexible for context-specific data
- Indexed by user, resource, time: Common query patterns
- Immutable: No UPDATE/DELETE grants

**Metadata Examples**:
```json
// Document upload
{
  "fileName": "policy.pdf",
  "fileSize": 1048576,
  "version": 1
}

// Document update
{
  "before": {"title": "Old Title"},
  "after": {"title": "New Title"}
}

// Document access
{
  "version": 2,
  "downloadMethod": "browser"
}
```

---

### 3.4 Soft Delete Implementation

**Decision**: Use `deleted_at TIMESTAMP NULL` pattern

**Implementation**:
```sql
-- Add to all user-facing tables
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE roles ADD COLUMN deleted_at TIMESTAMP NULL;

-- Query only active records
SELECT * FROM documents WHERE deleted_at IS NULL;

-- Soft delete
UPDATE documents SET deleted_at = NOW() WHERE id = ?;

-- Restore (future feature)
UPDATE documents SET deleted_at = NULL WHERE id = ?;
```

**Rationale**:
- Recoverability: Accidental deletes can be undone
- Audit trail: Maintain complete history
- Compliance: May need to retain deleted data

**Rules**:
- All `SELECT` queries filter `deleted_at IS NULL`
- Use ORM scopes/global filters to enforce
- Admin UI may show deleted records (future)

---

## 4. API Design Standards

### 4.1 RESTful Endpoint Patterns

**Decision**: Follow REST conventions strictly

**Patterns**:
```
# Collection operations
GET    /api/v1/documents           → List documents (with pagination)
POST   /api/v1/documents           → Create new document (upload)

# Resource operations
GET    /api/v1/documents/{id}      → Get document metadata
PATCH  /api/v1/documents/{id}      → Update document metadata
DELETE /api/v1/documents/{id}      → Soft delete document

# Sub-resources
GET    /api/v1/documents/{id}/versions         → List versions
GET    /api/v1/documents/{id}/versions/{version} → Get specific version

# Actions (when REST doesn't fit)
POST   /api/v1/documents/{id}/download  → Download file (requires permission check)
POST   /api/v1/auth/login               → Login (action, not resource)
POST   /api/v1/auth/refresh             → Refresh token
POST   /api/v1/auth/logout              → Logout
```

**Why POST for download?**
- Requires permission check before serving file
- May log access in audit table (side effect)
- Semantically not idempotent (logging changes state)

**Alternative**: Use `GET /api/v1/documents/{id}/download` but accept logging side effect

---

### 4.2 Response Format Standard

**Decision**: Consistent JSON response structure

**Success Response**:
```json
{
  "data": {
    "id": "abc-123",
    "title": "Employee Handbook",
    "version": 2
  },
  "meta": {
    "timestamp": "2026-01-01T12:00:00Z"
  }
}
```

**List Response**:
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

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "email: must be a valid email address",
    "password: must be at least 8 characters"
  ],
  "timestamp": "2026-01-01T12:00:00Z"
}
```

**Rationale**:
- Predictable structure for frontend parsing
- Pagination metadata in all list responses
- Error arrays support multiple validation failures

---

### 4.3 Error Handling Strategy

**Decision**: Use standard HTTP status codes with structured errors

**Status Code Guide**:

| Code | Use Case | Example |
|------|----------|---------|
| 200 | Success | Document retrieved |
| 201 | Created | Document uploaded |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Invalid/missing JWT token |
| 403 | Forbidden | User lacks permission |
| 404 | Not Found | Document ID doesn't exist |
| 409 | Conflict | Email already registered |
| 422 | Unprocessable Entity | Business rule violation (e.g., cannot delete system role) |
| 500 | Internal Server Error | Unexpected error (log stack trace) |

**Implementation**:
```typescript
// NestJS exception filters
throw new UnauthorizedException('Invalid token');
throw new ForbiddenException('Missing permission: document.delete');
throw new NotFoundException('Document not found');
throw new ConflictException('Email already exists');
throw new UnprocessableEntityException('Cannot delete system role');
```

**Never expose**:
- Stack traces in production
- Database error details
- Internal file paths
- Secrets or tokens

---

### 4.4 Pagination Strategy

**Decision**: Offset-based pagination (simple, sufficient for Phase-1)

**Query Parameters**:
```
GET /api/v1/documents?page=2&limit=20&sort=created_at&order=desc
```

**Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Field to sort by (default: `created_at`)
- `order`: `asc` or `desc` (default: `desc`)

**Response**:
```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 157,
    "totalPages": 8
  }
}
```

**Rationale**:
- Offset pagination simple to implement
- Sufficient for <10k documents (Phase-1 scope)
- Cursor-based pagination if performance issues later

---

## 5. Authentication & Authorization Patterns

### 5.1 JWT Payload Structure

**Decision**: Include permissions in access token payload

**Access Token Payload**:
```json
{
  "sub": "user-123",           // User ID
  "email": "user@example.com",
  "roles": ["manager", "hr"],  // Role names (for UI display)
  "permissions": [              // Flattened permission keys
    "document.upload",
    "document.view",
    "document.update",
    "user.view"
  ],
  "iat": 1735737600,           // Issued at
  "exp": 1735738500            // Expires at (15min)
}
```

**Rationale**:
- Frontend can hide/show UI elements without API call
- Backend re-validates permissions from DB (token is hint, not source of truth)
- Permissions flattened (wildcard resolved at token generation)

**Refresh Token Payload**:
```json
{
  "sub": "user-123",
  "sessionId": "session-abc-456",
  "iat": 1735737600,
  "exp": 1736342400  // 7 days
}
```

**Rationale**:
- Minimal payload (only user ID + session ID)
- Session ID allows revocation via database

---

### 5.2 Permission Guard Implementation

**Decision**: Custom NestJS decorator + guard

**Usage**:
```typescript
@Controller('documents')
export class DocumentsController {

  @Post()
  @RequirePermissions('document.upload')
  async uploadDocument(@Body() dto: UploadDocumentDto) {
    // Permission already validated by guard
    return this.documentsService.upload(dto);
  }

  @Delete(':id')
  @RequirePermissions('document.delete')
  async deleteDocument(@Param('id') id: string) {
    return this.documentsService.delete(id);
  }
}
```

**Guard Implementation**:
```typescript
@Injectable()
export class PermissionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler()
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JWT auth guard

    return this.hasPermissions(user, requiredPermissions);
  }

  private hasPermissions(user: User, required: string[]): boolean {
    return required.every(perm =>
      user.permissions.includes(perm) ||
      user.permissions.includes(perm.split('.')[0] + '.*')
    );
  }
}
```

**Rationale**:
- Declarative: Permissions visible at controller level
- Reusable: Guard logic centralized
- Testable: Easy to mock user permissions in tests

---

### 5.3 Login Flow

**Decision**: Return access token in body, refresh token in cookie

**Login Endpoint**:
```typescript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}

Response:
200 OK
Set-Cookie: refreshToken=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

{
  "data": {
    "accessToken": "<jwt>",
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "roles": ["manager"]
    }
  }
}
```

**Frontend Storage**:
- Access token: In-memory variable (not localStorage, prevents XSS)
- Refresh token: httpOnly cookie (automatic, prevents XSS)

**Rationale**:
- httpOnly cookie prevents JavaScript access (XSS protection)
- SameSite=Strict prevents CSRF
- Access token in memory lost on page refresh (fetch new via refresh endpoint)

---

### 5.4 Token Refresh Flow

**Decision**: Automatic refresh on 401, with retry

**Refresh Endpoint**:
```typescript
POST /api/v1/auth/refresh
Cookie: refreshToken=<jwt>

Response:
200 OK
Set-Cookie: refreshToken=<new_jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

{
  "data": {
    "accessToken": "<new_jwt>"
  }
}
```

**Frontend Implementation**:
```typescript
// Axios interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      const { data } = await axios.post('/api/v1/auth/refresh');
      setAccessToken(data.accessToken);

      error.config.headers.Authorization = `Bearer ${data.accessToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

**Rationale**:
- Transparent to user (automatic token refresh)
- Retry failed request after refresh
- Prevents refresh loops with `_retry` flag

---

## 6. File Storage Implementation

### 6.1 File Upload Flow

**Decision**: Multipart form upload → validation → storage → database

**Flow**:
1. Frontend sends multipart/form-data
2. Backend validates file size (<50MB)
3. Backend validates MIME type from content
4. Backend sanitizes filename
5. Backend generates UUID for document
6. Backend creates directory: `/storage/documents/{uuid}/v1/`
7. Backend saves file
8. Backend creates database records
9. Backend logs upload to audit table
10. Backend returns document metadata

**Code Structure**:
```typescript
@Post()
@UseInterceptors(FileInterceptor('file'))
@RequirePermissions('document.upload')
async uploadDocument(
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UploadDocumentDto,
  @CurrentUser() user: User
) {
  // Validation
  this.validateFileSize(file);
  this.validateMimeType(file);

  // Storage
  const documentId = uuid();
  const version = 1;
  const filePath = await this.storageService.save(documentId, version, file);

  // Database
  const document = await this.documentsService.create({
    id: documentId,
    title: dto.title,
    current_version: version,
    uploaded_by: user.id
  });

  await this.documentVersionsService.create({
    document_id: documentId,
    version: version,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.mimetype
  });

  // Audit
  await this.auditService.log({
    user_id: user.id,
    action: 'CREATE',
    resource_type: 'document',
    resource_id: documentId,
    metadata: { fileName: file.originalname, fileSize: file.size }
  });

  return { data: document };
}
```

---

### 6.2 File Download Flow

**Decision**: Backend streams file after permission check

**Flow**:
1. Frontend requests `/api/v1/documents/{id}/download`
2. Backend validates user has `document.view` permission
3. Backend fetches document metadata
4. Backend resolves file path from `document_versions` table
5. Backend logs access to audit table
6. Backend streams file with headers
7. Browser downloads file

**Implementation**:
```typescript
@Get(':id/download')
@RequirePermissions('document.view')
async downloadDocument(
  @Param('id') id: string,
  @CurrentUser() user: User,
  @Res() response: Response
) {
  const document = await this.documentsService.findOne(id);
  if (!document) throw new NotFoundException();

  const version = await this.documentVersionsService.findVersion(
    id,
    document.current_version
  );

  // Audit log
  await this.auditService.log({
    user_id: user.id,
    action: 'ACCESS',
    resource_type: 'document',
    resource_id: id,
    metadata: { version: version.version }
  });

  // Stream file
  const fileStream = createReadStream(version.file_path);
  response.set({
    'Content-Type': version.mime_type,
    'Content-Disposition': `attachment; filename="${version.filename}"`,
    'Content-Length': version.file_size
  });

  fileStream.pipe(response);
}
```

**Rationale**:
- Streaming prevents memory issues with large files
- Permission check before file access (critical security)
- Audit log tracks who accessed what

---

### 6.3 Filename Sanitization

**Decision**: Remove unsafe characters, prevent path traversal

**Implementation**:
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '')         // Remove ".."
    .replace(/[\/\\]/g, '')       // Remove slashes
    .replace(/[^a-zA-Z0-9._-]/g, '_')  // Replace special chars
    .substring(0, 255);           // Limit length
}

// Usage
const safeFilename = sanitizeFilename(file.originalname);
// "../../etc/passwd" → "etcpasswd"
// "my document!@#.pdf" → "my_document___.pdf"
```

---

### 6.4 MIME Type Validation

**Decision**: Validate from file content, not extension

**Implementation**:
```typescript
import * as fileType from 'file-type';

async function validateMimeType(file: Express.Multer.File) {
  const detectedType = await fileType.fromBuffer(file.buffer);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'text/plain',
    'text/markdown'
  ];

  if (!detectedType || !allowedTypes.includes(detectedType.mime)) {
    throw new BadRequestException('Invalid file type');
  }

  return detectedType.mime;
}
```

**Rationale**:
- Extension can be spoofed: `malware.exe` → `malware.pdf`
- File content detection more reliable
- Prevents executable uploads

---

## 7. Frontend Implementation Guidelines

### 7.1 When to Use Server vs Client Components

**Decision**: Default to Server Components, use Client only when needed

**Server Components (RSC)** - Use for:
- Data fetching from backend API
- Static layouts and pages
- Rendering lists of data
- No user interactivity

**Client Components** - Use for:
- Forms with input fields
- Click handlers, event listeners
- State management (useState, useReducer)
- Browser APIs (localStorage, etc.)

**Example**:
```typescript
// app/documents/page.tsx (Server Component)
export default async function DocumentsPage() {
  const documents = await fetch('http://backend/api/v1/documents').then(r => r.json());

  return (
    <div>
      <h1>Documents</h1>
      <DocumentList documents={documents.data} />  {/* Server Component */}
      <UploadButton />  {/* Client Component */}
    </div>
  );
}

// app/documents/components/upload-button.tsx (Client Component)
'use client';

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button onClick={() => setIsOpen(true)}>
      Upload Document
    </button>
  );
}
```

---

### 7.2 State Management Strategy

**Decision**: Minimize client-side state, prefer server state

**State Categories**:

| State Type | Storage | Example |
|------------|---------|---------|
| Server state | Fetch from API | Document list, user profile |
| UI state | useState | Modal open/closed, form inputs |
| Global UI state | React Context | Theme, sidebar collapsed |
| Auth state | Memory + httpOnly cookie | Access token, user info |

**Avoid**:
- Redux/MobX in Phase-1 (overkill for this scope)
- Storing server data in client state (use React Query or SWR if caching needed)

**Example**:
```typescript
// ❌ BAD: Storing server data in useState
const [documents, setDocuments] = useState([]);
useEffect(() => {
  fetch('/api/documents').then(r => r.json()).then(setDocuments);
}, []);

// ✅ GOOD: Fetch in Server Component
export default async function DocumentsPage() {
  const documents = await fetch('http://backend/api/v1/documents').then(r => r.json());
  return <DocumentList documents={documents.data} />;
}

// ✅ ALSO GOOD: Use React Query for client-side caching (if needed)
'use client';
const { data, isLoading } = useQuery('documents', () =>
  fetch('/api/documents').then(r => r.json())
);
```

---

### 7.3 Permission-Based UI Rendering

**Decision**: Hide UI elements based on permissions (UX optimization)

**Implementation**:
```typescript
// lib/auth.ts
export function usePermissions() {
  const user = useUser();  // From auth context
  return user?.permissions || [];
}

export function hasPermission(permissions: string[], required: string): boolean {
  return permissions.includes(required) ||
         permissions.includes(required.split('.')[0] + '.*');
}

// components/document-actions.tsx
'use client';

export function DocumentActions({ documentId }: { documentId: string }) {
  const permissions = usePermissions();

  return (
    <div>
      {hasPermission(permissions, 'document.view') && (
        <button onClick={() => download(documentId)}>Download</button>
      )}

      {hasPermission(permissions, 'document.update') && (
        <button onClick={() => edit(documentId)}>Edit</button>
      )}

      {hasPermission(permissions, 'document.delete') && (
        <button onClick={() => deleteDoc(documentId)}>Delete</button>
      )}
    </div>
  );
}
```

**Important**:
- This is UI optimization only (improves UX)
- Backend ALWAYS validates permissions (security)
- Never trust frontend permission checks

---

### 7.4 API Client Structure

**Decision**: Centralized API client with interceptors

**Implementation**:
```typescript
// lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000
});

// Request interceptor: Add access token
apiClient.interceptors.request.use(config => {
  const token = getAccessToken();  // From memory
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401, refresh token
apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      try {
        const { data } = await axios.post('/api/v1/auth/refresh');
        setAccessToken(data.accessToken);
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(error.config);
      } catch (refreshError) {
        // Refresh failed, logout user
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

**Usage**:
```typescript
import apiClient from '@/lib/api-client';

export async function getDocuments() {
  const { data } = await apiClient.get('/api/v1/documents');
  return data;
}

export async function uploadDocument(file: File, title: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  const { data } = await apiClient.post('/api/v1/documents', formData);
  return data;
}
```

---

## 8. Testing Strategy

### 8.1 Test Coverage Requirements

**Decision**: Minimum 70% backend coverage, focus on critical paths

**Priority**:
1. **High**: Authentication, authorization, permission checks
2. **High**: Document upload, download, versioning
3. **Medium**: User/role management
4. **Low**: Simple CRUD operations

**Coverage Targets**:
- Backend services: 80%
- Backend controllers: 70%
- Frontend components: 50% (Phase-1)

---

### 8.2 Backend Testing Patterns

**Unit Tests** - Test services in isolation:
```typescript
describe('DocumentsService', () => {
  let service: DocumentsService;
  let repository: MockRepository<Document>;

  beforeEach(() => {
    repository = createMockRepository();
    service = new DocumentsService(repository);
  });

  it('should create a document', async () => {
    const dto = { title: 'Test Doc', uploadedBy: 'user-123' };
    const result = await service.create(dto);

    expect(result.title).toBe('Test Doc');
    expect(repository.save).toHaveBeenCalled();
  });
});
```

**Integration Tests** - Test API endpoints:
```typescript
describe('DocumentsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    accessToken = await loginAsUser('user@example.com', 'password');
  });

  it('POST /documents - should upload document', () => {
    return request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', './test/fixtures/test.pdf')
      .field('title', 'Test Document')
      .expect(201)
      .expect(res => {
        expect(res.body.data.id).toBeDefined();
        expect(res.body.data.title).toBe('Test Document');
      });
  });

  it('GET /documents/:id - should return 403 without permission', () => {
    const tokenWithoutPermission = generateToken({ permissions: [] });

    return request(app.getHttpServer())
      .get('/api/v1/documents/doc-123')
      .set('Authorization', `Bearer ${tokenWithoutPermission}`)
      .expect(403);
  });
});
```

---

### 8.3 Permission Guard Testing

**Decision**: Test permission enforcement in isolation

```typescript
describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;

  it('should allow access with required permission', () => {
    const user = { permissions: ['document.upload'] };
    const context = createMockContext(user, ['document.upload']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access with wildcard permission', () => {
    const user = { permissions: ['document.*'] };
    const context = createMockContext(user, ['document.upload']);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access without permission', () => {
    const user = { permissions: ['document.view'] };
    const context = createMockContext(user, ['document.delete']);

    expect(guard.canActivate(context)).toBe(false);
  });
});
```

---

## 9. Deployment & Operations

### 9.1 Environment Configuration

**Decision**: Different .env files per environment

**Files**:
- `.env.development` - Local development
- `.env.staging` - Staging server
- `.env.production` - Production server
- `.env.sample` - Template (committed to git)

**Required Variables** (in `.env.sample`):
```bash
# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=doc_manager
DB_USER=app_user
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
BACKEND_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

---

### 9.2 Docker Compose Strategy

**Decision**: Single docker-compose.yml for local development

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: doc_manager
      MYSQL_USER: app_user
      MYSQL_PASSWORD: apppassword
    volumes:
      - ./infra/mysql/data:/var/lib/mysql
      - ./infra/mysql/init:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./apps/backend
      dockerfile: ../../infra/docker/backend.Dockerfile
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: doc_manager
      DB_USER: app_user
      DB_PASSWORD: apppassword
    volumes:
      - ./storage/documents:/app/storage/documents
    ports:
      - "3001:3001"

  frontend:
    build:
      context: ./apps/frontend
      dockerfile: ../../infra/docker/frontend.Dockerfile
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    ports:
      - "3000:3000"
```

---

### 9.3 Startup Order

**Decision**: Use healthchecks and depends_on for proper startup

**Order**:
1. MySQL starts
2. Wait for MySQL healthy (healthcheck)
3. Backend runs migrations
4. Backend runs seeds
5. Backend starts server
6. Frontend starts

**Backend Startup Script**:
```bash
#!/bin/bash
# apps/backend/start.sh

echo "Waiting for database..."
while ! mysqladmin ping -h"$DB_HOST" --silent; do
    sleep 1
done

echo "Running migrations..."
npm run migration:run

echo "Running seeds..."
npm run seed:run

echo "Starting server..."
npm run start:prod
```

---

## 10. Migration & Rollback Strategy

### 10.1 Migration File Format

**Decision**: Timestamp-prefixed SQL files

**Naming**: `{YYYYMMDDHHMMSS}_{description}.sql`

**Example**:
```sql
-- 20260101120000_create_users_table.sql

-- UP Migration
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_email (email),
  INDEX idx_deleted_at (deleted_at)
);

-- DOWN Migration (rollback)
-- DROP TABLE users;
```

---

### 10.2 Migration Execution

**Decision**: Use TypeORM migrations (or custom script)

**Commands**:
```bash
# Generate migration
npm run migration:generate -- -n CreateUsersTable

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

---

## 11. Common Pitfalls & Solutions

### 11.1 Don't Check Role Names

❌ **WRONG**:
```typescript
if (user.role.name === 'admin') {
  allowAccess();
}
```

✅ **CORRECT**:
```typescript
@RequirePermissions('document.delete')
deleteDocument() {
  // Permission guard handles authorization
}
```

---

### 11.2 Don't Put Business Logic in Frontend

❌ **WRONG**:
```typescript
// Frontend calculating total
const total = items.reduce((sum, item) =>
  sum + (item.price * item.quantity * (1 - item.discount)), 0
);
```

✅ **CORRECT**:
```typescript
// Backend endpoint
GET /api/v1/cart/total → { "total": 99.99 }

// Frontend fetches
const { total } = await apiClient.get('/cart/total').then(r => r.data);
```

---

### 11.3 Don't Store Refresh Tokens in localStorage

❌ **WRONG**:
```typescript
localStorage.setItem('refreshToken', token);  // Vulnerable to XSS
```

✅ **CORRECT**:
```typescript
// Backend sets httpOnly cookie
response.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000
});
```

---

### 11.4 Don't Hard Delete

❌ **WRONG**:
```typescript
await this.documentsRepository.delete(id);
```

✅ **CORRECT**:
```typescript
await this.documentsRepository.update(id, { deleted_at: new Date() });
```

---

## Document Maintenance

**Purpose**: Implementation guidance and best practices
**Audience**: Developers and AI assistants
**Update Frequency**: As patterns evolve
**Version**: 1.0.0 (Phase-1)
**Last Updated**: 2026-01-01

---

## Quick Reference

**Before implementing a feature, ask**:
1. Does it violate [CONSTRAINTS.md](CONSTRAINTS.md)? → **Reject**
2. Where does logic belong? → **Backend if business logic**
3. What permissions needed? → **Add to database first**
4. Does it change schema? → **Create migration first**
5. How to test? → **Unit + integration tests**

**When in doubt**:
- Security enforcement → Backend
- UI rendering → Frontend
- Data transformation → Backend
- User interaction → Frontend
- RBAC checks → Permission guards, never role names

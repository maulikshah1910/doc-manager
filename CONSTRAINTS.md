# Application Constraints

## Document Purpose

This document defines **HARD CONSTRAINTS** - non-negotiable architectural boundaries that must never be violated. These are immutable rules that protect the system's integrity and security model.

**When to reference this document**: Before implementing any feature, validate it against these constraints. If a constraint is violated, the feature must be rejected or redesigned.

---

## 1. Architectural Hard Constraints

### 1.1 Single Organization Only

**CONSTRAINT**: This is NOT a multi-tenant SaaS platform.

- ❌ FORBIDDEN: organization_id, tenant_id, workspace_id fields
- ❌ FORBIDDEN: Organization selection UI
- ❌ FORBIDDEN: Cross-organization data isolation logic
- ✅ REQUIRED: All users implicitly belong to the same organization

**Validation**: Database schema must not contain organization/tenant tables.

---

### 1.2 Backend-Enforced Security

**CONSTRAINT**: All security enforcement happens in the backend.

- ❌ FORBIDDEN: Frontend authorization logic
- ❌ FORBIDDEN: Frontend-only permission checks
- ❌ FORBIDDEN: Client-side data filtering by permissions
- ✅ REQUIRED: Every protected API endpoint has authentication + authorization guards
- ✅ REQUIRED: Backend validates permissions before any operation

**Validation**: Frontend permission checks are UI-only (hiding buttons), never security.

---

### 1.3 Database-Driven RBAC

**CONSTRAINT**: Permissions are data, not code.

- ❌ FORBIDDEN: Hardcoded permission enums in code
- ❌ FORBIDDEN: Role name checks: `if (user.role === 'admin')`
- ❌ FORBIDDEN: Switch/case statements on role names
- ✅ REQUIRED: Permissions stored in database as string keys
- ✅ REQUIRED: Permission checks use guards: `@RequirePermissions('document.upload')`
- ✅ REQUIRED: New permissions added via database inserts, not code changes

**Validation**: No role name comparisons in business logic; only permission key checks.

---

### 1.4 Audit by Default

**CONSTRAINT**: All state-changing operations must be logged.

- ❌ FORBIDDEN: Mutations without audit log entries
- ❌ FORBIDDEN: Updating or deleting audit logs
- ❌ FORBIDDEN: Audit logging as optional/configurable
- ✅ REQUIRED: CREATE, UPDATE, DELETE operations generate audit entries
- ✅ REQUIRED: Document access (VIEW, DOWNLOAD) logged
- ✅ REQUIRED: Audit logs are append-only (immutable)

**Validation**: Audit table has no UPDATE or DELETE permissions in database.

---

### 1.5 Versioned Document Storage

**CONSTRAINT**: Documents are never overwritten; versions are created.

- ❌ FORBIDDEN: Overwriting existing document files
- ❌ FORBIDDEN: Hard deleting documents from storage
- ❌ FORBIDDEN: Single-version document storage
- ✅ REQUIRED: New uploads create new versions
- ✅ REQUIRED: Storage structure: `{doc_id}/v{version}/file.ext`
- ✅ REQUIRED: Soft delete only (metadata marked deleted_at, files remain)

**Validation**: No file system delete operations in document management code.

---

### 1.6 Frontend is UI-Only

**CONSTRAINT**: Frontend is a presentation layer with zero business logic.

- ❌ FORBIDDEN: Business logic calculations in frontend
- ❌ FORBIDDEN: Data validation in frontend (except UX feedback)
- ❌ FORBIDDEN: Direct database access from frontend
- ❌ FORBIDDEN: Direct file system access from frontend
- ❌ FORBIDDEN: Frontend services, repositories, or ORM
- ✅ REQUIRED: All data transformations happen in backend
- ✅ REQUIRED: Frontend only consumes APIs and renders UI

**Validation**: Frontend codebase contains no business logic, only API calls and rendering.

---

## 2. Technology Stack Constraints

### 2.1 Backend: NestJS Only

**CONSTRAINT**: Backend framework is NestJS.

- ❌ FORBIDDEN: Mixing Express, Fastify, or other frameworks
- ❌ FORBIDDEN: Raw Express middleware where NestJS features exist
- ✅ REQUIRED: Use NestJS decorators (@Injectable, @Controller, @Module)
- ✅ REQUIRED: Follow NestJS module structure
- ✅ REQUIRED: Use NestJS guards for authorization

---

### 2.2 Frontend: Next.js App Router Only

**CONSTRAINT**: Frontend framework is Next.js with App Router.

- ❌ FORBIDDEN: Pages Router (legacy Next.js routing)
- ❌ FORBIDDEN: Client-side only rendering (use RSC where possible)
- ✅ REQUIRED: Use App Router conventions
- ✅ REQUIRED: React Server Components for data fetching
- ✅ REQUIRED: Client Components only for interactivity

---

### 2.3 Database: MySQL Only

**CONSTRAINT**: Database is MySQL 8.0+.

- ❌ FORBIDDEN: NoSQL databases (MongoDB, etc.)
- ❌ FORBIDDEN: Mixed database strategy
- ❌ FORBIDDEN: JSON columns for relational data
- ❌ FORBIDDEN: EAV (Entity-Attribute-Value) patterns
- ✅ REQUIRED: All schema changes via SQL migrations
- ✅ REQUIRED: Use ORM (TypeORM) for queries
- ✅ REQUIRED: Relational data model with foreign keys

---

### 2.4 Authentication: JWT Only

**CONSTRAINT**: Authentication uses JWT with Access + Refresh tokens.

- ❌ FORBIDDEN: Session cookies for authentication
- ❌ FORBIDDEN: Social login (Google, GitHub, etc.) in Phase-1
- ❌ FORBIDDEN: Storing refresh tokens in localStorage
- ✅ REQUIRED: Access tokens expire in 15 minutes
- ✅ REQUIRED: Refresh tokens expire in 7 days
- ✅ REQUIRED: Refresh tokens stored in httpOnly cookies
- ✅ REQUIRED: Access tokens passed in Authorization header

---

## 3. Data Model Constraints

### 3.1 No Hard Deletes

**CONSTRAINT**: All deletions are soft deletes.

- ❌ FORBIDDEN: `DELETE FROM table` statements
- ❌ FORBIDDEN: Removing records permanently
- ✅ REQUIRED: Use `deleted_at TIMESTAMP NULL` column
- ✅ REQUIRED: Filter deleted records in queries: `WHERE deleted_at IS NULL`
- ✅ REQUIRED: Document files remain on disk after soft delete

---

### 3.2 Immutable Audit Logs

**CONSTRAINT**: Audit logs cannot be modified or deleted.

- ❌ FORBIDDEN: UPDATE on audit_logs table
- ❌ FORBIDDEN: DELETE on audit_logs table
- ❌ FORBIDDEN: Truncating audit logs
- ✅ REQUIRED: Audit logs are append-only
- ✅ REQUIRED: Database permissions prevent updates/deletes

**Schema Enforcement**:
```sql
-- No UPDATE or DELETE grants on audit_logs
GRANT INSERT, SELECT ON audit_logs TO app_user;
```

---

### 3.3 Permission Keys are Strings

**CONSTRAINT**: Permissions use dot-notation string keys.

- ❌ FORBIDDEN: Permission IDs as integers in code
- ❌ FORBIDDEN: Hardcoded permission enums
- ✅ REQUIRED: Format: `resource.action` (e.g., `document.upload`)
- ✅ REQUIRED: Wildcard support: `document.*`
- ✅ REQUIRED: Scoped permissions: `document.view.own`, `document.view.all`

**Examples**:
- `document.upload`
- `document.view`
- `document.update`
- `document.delete`
- `user.manage`
- `role.manage`
- `log.view`

---

### 3.4 UUIDs for Document IDs

**CONSTRAINT**: Document IDs are UUIDs (not auto-increment integers).

- ❌ FORBIDDEN: Auto-increment integer IDs for documents
- ✅ REQUIRED: UUID v4 for document identifiers
- ✅ REQUIRED: Prevents enumeration attacks
- ✅ REQUIRED: Used in file storage paths

---

## 4. File Storage Constraints

### 4.1 Local Storage Only (Phase-1)

**CONSTRAINT**: Files stored on local file system in Phase-1.

- ❌ FORBIDDEN: S3, GCS, Azure Blob, or external object storage
- ❌ FORBIDDEN: Storing files in database (BLOB columns)
- ✅ REQUIRED: Files in mounted volume: `/storage/documents/`
- ✅ REQUIRED: Directory structure: `{doc_id}/v{version}/filename`

---

### 4.2 Backend-Mediated File Access

**CONSTRAINT**: Frontend never accesses storage directly.

- ❌ FORBIDDEN: Frontend reading files from storage path
- ❌ FORBIDDEN: Direct URLs to storage directory: `/storage/docs/file.pdf`
- ❌ FORBIDDEN: Static file serving from storage directory
- ✅ REQUIRED: All file access via backend API: `/api/v1/documents/{id}/download`
- ✅ REQUIRED: Backend validates permissions before serving files

---

### 4.3 No Physical File Deletion (Phase-1)

**CONSTRAINT**: Files remain on disk even after deletion.

- ❌ FORBIDDEN: Deleting files from file system
- ❌ FORBIDDEN: Automated cleanup of deleted documents
- ✅ REQUIRED: Soft delete sets `documents.deleted_at`
- ✅ REQUIRED: Files remain for potential recovery
- ✅ REQUIRED: Future phase may add admin restore feature

---

### 4.4 File Upload Limits

**CONSTRAINT**: File size and type restrictions.

- ❌ FORBIDDEN: Uploads larger than 50MB
- ❌ FORBIDDEN: Executable files (.exe, .sh, .bat)
- ❌ FORBIDDEN: Files without MIME type validation
- ✅ REQUIRED: Max file size: 50MB (52,428,800 bytes)
- ✅ REQUIRED: Allowed types: PDF, DOCX, XLSX, PNG, JPG, TXT, MD
- ✅ REQUIRED: MIME type validation from file content (not extension)

---

## 5. API Design Constraints

### 5.1 RESTful Conventions

**CONSTRAINT**: APIs follow REST principles.

- ❌ FORBIDDEN: RPC-style endpoints: `/api/getUserById`
- ❌ FORBIDDEN: Verbs in URLs: `/api/createDocument`
- ✅ REQUIRED: Resource-oriented URLs: `/api/v1/documents/{id}`
- ✅ REQUIRED: HTTP methods: GET (read), POST (create), PATCH (update), DELETE (soft delete)

---

### 5.2 All Endpoints Authenticated (Except Auth)

**CONSTRAINT**: Authentication required on all endpoints except auth routes.

- ❌ FORBIDDEN: Public endpoints that expose data
- ❌ FORBIDDEN: Optional authentication
- ✅ REQUIRED: JWT validation on every request (except `/auth/login`, `/auth/refresh`)
- ✅ REQUIRED: Missing/invalid tokens return 401 Unauthorized

---

### 5.3 Authorization via Permissions Only

**CONSTRAINT**: Authorization uses permission guards, not role checks.

- ❌ FORBIDDEN: `if (user.role.name === 'admin')` in code
- ❌ FORBIDDEN: Role-based routing or access
- ✅ REQUIRED: Every protected endpoint has `@RequirePermissions()` decorator
- ✅ REQUIRED: Missing permissions return 403 Forbidden

---

### 5.4 No Stack Traces in Responses

**CONSTRAINT**: Error responses must not expose internal details.

- ❌ FORBIDDEN: Stack traces in API responses
- ❌ FORBIDDEN: Database error messages to client
- ❌ FORBIDDEN: Internal file paths in errors
- ✅ REQUIRED: Structured error responses with safe messages
- ✅ REQUIRED: Internal errors logged server-side only

---

## 6. Security Constraints

### 6.1 Input Validation on Backend

**CONSTRAINT**: All user input validated server-side.

- ❌ FORBIDDEN: Trusting client-side validation
- ❌ FORBIDDEN: Skipping validation for "trusted" clients
- ✅ REQUIRED: DTO validation on all request bodies
- ✅ REQUIRED: Filename sanitization (remove `../`, special chars)
- ✅ REQUIRED: MIME type validation from file content

---

### 6.2 No Raw SQL with User Input

**CONSTRAINT**: Use ORM parameterized queries only.

- ❌ FORBIDDEN: String concatenation in SQL queries
- ❌ FORBIDDEN: Template literals with user input in SQL
- ✅ REQUIRED: ORM (TypeORM) for all queries
- ✅ REQUIRED: Parameterized queries if raw SQL required

---

### 6.3 Password Security

**CONSTRAINT**: Passwords hashed with bcrypt.

- ❌ FORBIDDEN: Plaintext passwords
- ❌ FORBIDDEN: Weak hashing (MD5, SHA1)
- ❌ FORBIDDEN: Storing passwords in logs
- ✅ REQUIRED: bcrypt with 10 rounds minimum
- ✅ REQUIRED: Password validation: min 8 chars, uppercase, lowercase, number

---

### 6.4 No Sensitive Data in Logs

**CONSTRAINT**: Logs must not contain sensitive information.

- ❌ FORBIDDEN: Passwords in logs
- ❌ FORBIDDEN: JWT tokens in logs
- ❌ FORBIDDEN: Full credit card numbers (N/A in Phase-1)
- ✅ REQUIRED: Sanitize log entries
- ✅ REQUIRED: Log user IDs, not passwords or tokens

---

## 7. Phase-1 Scope Constraints

### 7.1 No AI/GenAI Features

**CONSTRAINT**: AI features explicitly excluded from Phase-1.

- ❌ FORBIDDEN: Vector databases (Pinecone, Weaviate, ChromaDB)
- ❌ FORBIDDEN: Embeddings generation
- ❌ FORBIDDEN: RAG (Retrieval-Augmented Generation) pipelines
- ❌ FORBIDDEN: Chatbots, assistants, or conversational AI
- ❌ FORBIDDEN: Semantic search
- ❌ FORBIDDEN: LLM API calls (OpenAI, Anthropic, etc.)
- ❌ FORBIDDEN: Document summarization or Q&A features

**Note**: Architecture should support future AI features without breaking changes.

---

### 7.2 No Multi-Organization Support

**CONSTRAINT**: See section 1.1 (Single Organization Only).

---

### 7.3 No External Storage (Phase-1)

**CONSTRAINT**: See section 4.1 (Local Storage Only).

---

### 7.4 No Social Login (Phase-1)

**CONSTRAINT**: Email/password authentication only.

- ❌ FORBIDDEN: OAuth providers (Google, GitHub, Microsoft)
- ❌ FORBIDDEN: SAML/SSO integration
- ✅ REQUIRED: Email + password authentication only

---

### 7.5 No Real-Time Features (Phase-1)

**CONSTRAINT**: No WebSocket or real-time sync.

- ❌ FORBIDDEN: WebSocket connections
- ❌ FORBIDDEN: Server-Sent Events (SSE)
- ❌ FORBIDDEN: Real-time collaboration
- ✅ REQUIRED: Standard HTTP request/response only

---

### 7.6 No Email Notifications (Phase-1)

**CONSTRAINT**: No email sending functionality.

- ❌ FORBIDDEN: Email service integration (SendGrid, SES, etc.)
- ❌ FORBIDDEN: Password reset via email
- ❌ FORBIDDEN: Notification emails
- ✅ REQUIRED: Admin manually resets passwords if needed

---

### 7.7 No Public API (Phase-1)

**CONSTRAINT**: Internal use only, no public API access.

- ❌ FORBIDDEN: API keys for external access
- ❌ FORBIDDEN: Rate-limited public endpoints
- ❌ FORBIDDEN: API documentation for external developers
- ✅ REQUIRED: All API users are authenticated organization members

---

## 8. Code Quality Constraints

### 8.1 TypeScript Strict Mode

**CONSTRAINT**: TypeScript strict mode must be enabled.

- ❌ FORBIDDEN: `any` type (use `unknown` if needed)
- ❌ FORBIDDEN: Disabling strict mode
- ❌ FORBIDDEN: `@ts-ignore` or `@ts-expect-error` without explanation
- ✅ REQUIRED: Explicit return types for functions
- ✅ REQUIRED: Strict null checks enabled

---

### 8.2 No Commented-Out Code

**CONSTRAINT**: Production code must be clean.

- ❌ FORBIDDEN: Commented-out code blocks
- ❌ FORBIDDEN: Dead code (unreachable branches)
- ✅ REQUIRED: Use version control for code history
- ✅ REQUIRED: Remove unused imports and variables

---

### 8.3 All Schema Changes via Migrations

**CONSTRAINT**: Database schema changes must use migration files.

- ❌ FORBIDDEN: Manual ALTER TABLE in production
- ❌ FORBIDDEN: Schema changes without migrations
- ❌ FORBIDDEN: Editing merged migration files
- ✅ REQUIRED: Migration files for all schema changes
- ✅ REQUIRED: Rollback scripts for every migration
- ✅ REQUIRED: Migrations are immutable after merge

---

## 9. Testing Constraints

### 9.1 Minimum Test Coverage

**CONSTRAINT**: Backend test coverage minimum 70%.

- ❌ FORBIDDEN: Merging code with <70% coverage
- ❌ FORBIDDEN: Skipping tests for "simple" code
- ✅ REQUIRED: Unit tests for services and utilities
- ✅ REQUIRED: Integration tests for API endpoints
- ✅ REQUIRED: Test authentication and authorization flows

---

### 9.2 No Test Code in Production

**CONSTRAINT**: Test utilities must not be bundled in production.

- ❌ FORBIDDEN: Test dependencies in production builds
- ❌ FORBIDDEN: Mock data services in production
- ✅ REQUIRED: Separate dev/test dependencies
- ✅ REQUIRED: Environment-based test exclusion

---

## 10. Deployment Constraints

### 10.1 Environment Variables for All Config

**CONSTRAINT**: No hardcoded configuration.

- ❌ FORBIDDEN: Hardcoded database credentials
- ❌ FORBIDDEN: Hardcoded JWT secrets
- ❌ FORBIDDEN: Hardcoded API URLs
- ✅ REQUIRED: All config via environment variables
- ✅ REQUIRED: `.env.sample` file with all required variables
- ✅ REQUIRED: Validation of required env vars at startup

---

### 10.2 Container-Based Deployment

**CONSTRAINT**: Docker containers for all services.

- ❌ FORBIDDEN: Running directly on host (no Docker)
- ❌ FORBIDDEN: Manual dependency installation
- ✅ REQUIRED: Dockerfile for frontend and backend
- ✅ REQUIRED: docker-compose.yml for orchestration
- ✅ REQUIRED: Volume mounts for persistent data

---

## Validation Questions

Before implementing any feature, ask:

1. ✅ Does this violate any HARD CONSTRAINT? → **REJECT if yes**
2. ✅ Is this on the Phase-1 Exclusion list? → **DEFER if yes**
3. ✅ Does backend enforce all security? → **REQUIRED**
4. ✅ Are permissions checked by key (not role name)? → **REQUIRED**
5. ✅ Are mutations logged to audit table? → **REQUIRED**
6. ✅ Is this business logic in backend only? → **REQUIRED**
7. ✅ Are schema changes via migrations? → **REQUIRED**

---

## Document Maintenance

**Purpose**: Immutable architectural boundaries
**Audience**: All developers and AI assistants
**Update Frequency**: Only when core architecture changes (rare)
**Version**: 1.0.0 (Phase-1)
**Last Updated**: 2026-01-01

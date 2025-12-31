# Internal Document Management Platform (Phase-1)

## Overview

This repository contains the Phase-1 implementation of an internal, single-organization
document management platform.

The system allows authenticated users within the same organization to upload, manage,
and access internal documents such as:

- Organizational policies
- Employee offer letters
- Equipment hand-over sheets
- Freelancer agreements
- Other internal documents

The platform enforces database-driven Role-Based Access Control (RBAC), maintains audit
logs, and supports secure file storage.

AI-based features are explicitly out of scope for Phase-1 and will be introduced in
later phases.

---

## Core Principles

The system is built on the following non-negotiable principles:

- Single organization only (not a SaaS, no multi-tenancy)
- Backend-enforced security
- Database-driven RBAC
- Auditability by default
- Versioned document storage
- Frontend is UI-only and never a source of truth

---

## Technology Stack

- Frontend: Next.js
- Backend: NestJS
- Database: MySQL
- Authentication: JWT (Access & Refresh Tokens)
- Containers: Docker, Docker Compose
- Repository Type: Monorepo

---

## Repository Structure

doc-manager/
│
├── apps/ # Executable applications
│ ├── frontend/ # Next.js UI
│ └── backend/ # NestJS API
│
├── infra/ # Infrastructure & persistence
│ ├── docker/ # Dockerfiles
│ ├── mysql/ # DB schema, seeds, migrations
│ └── scripts/ # Infra helper scripts
│
├── shared/ # Cross-app contracts (NO logic)
│ ├── permissions/ # Permission key registry
│ ├── constants/ # App-wide constants
│ └── types/ # Shared DTO-style types
│
├── storage/ # Runtime file storage (mounted)
│ └── documents/
│
├── docker-compose.yml # Root orchestration
├── .env.sample
├── .gitignore
└── README.md


---

## Scope: Phase-1

### Included

- Authentication (JWT-based)
- User management
- Role management
- Database-driven permissions
- Role-to-permission mapping
- Document upload and versioning
- Access control enforcement
- Audit and access logs
- Local file storage (container-mounted)

### Explicitly Excluded

- AI / GenAI features
- Vector databases
- Embeddings
- Chatbots or assistants
- Multi-organization support
- External object storage (S3, GCS, etc.)

---

## RBAC Model

Authorization follows the hierarchy:


### Characteristics

- Permissions are stored in the database
- Roles are collections of permissions
- Permissions are string-based keys (not enums)
- New permissions can be added without refactoring code

### Example Permission Keys

document.upload
document.view
document.update
document.delete

user.manage
role.manage
log.view


Backend authorization is enforced using permission guards, not role name checks.

---

## File Storage Strategy (Phase-1)

- Files are stored outside application code
- Storage is mounted into the backend container
- Frontend never accesses files directly
- All file access is mediated by backend APIs

storage/documents/
└── {document_id}/
└── v{version}/
└── file.ext


---

## Backend Responsibilities

- Authentication and token lifecycle
- RBAC enforcement
- User and role management
- Permission evaluation
- Document metadata management
- File system access
- Audit logging

The backend is the single source of truth.

---

## Frontend Responsibilities

- UI rendering
- Navigation and layouts
- API consumption
- Permission-based UI visibility (non-authoritative)
- No business logic
- No security enforcement

---

## Database Responsibilities

- Persist users, roles, and permissions
- Maintain role-permission mappings
- Store document metadata
- Maintain audit logs
- Track active sessions

---

## Development Workflow

Planned development order:

1. Frontend layout and page structure
2. Database schema and migrations
3. ORM models
4. Authentication and session management
5. RBAC permission guards
6. User and role modules
7. Document management modules
8. Access logging

---

## Future Phases (Out of Scope)

- AI ingestion pipelines
- RAG-based document querying
- Internal chat assistants
- Semantic search
- Vector databases
- AI prompt governance

Phase-1 is intentionally designed to support these later without refactoring core
architecture.

---

## Audience

This repository is intended for:

- Internal engineering teams
- Frontend and backend developers
- Infrastructure engineers
- AI assistants (Claude, ChatGPT, Copilot) used during development

---

## Important Notes for AI Assistants

- This is not a SaaS product
- There is only one organization
- RBAC is database-driven
- Permissions are extensible
- Backend enforces all security
- AI features are out of scope for Phase-1

---

## License

Internal / Private use.

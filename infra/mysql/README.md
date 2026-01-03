# MySQL Database Migrations

Database schema and migration management for the Document Manager platform.

For complete setup instructions and development guidelines, see [DEVELOPMENT.md](../../DEVELOPMENT.md).

---

## Quick Start

```bash
# 1. Setup database and run migrations
./infra/scripts/db-setup.sh

# 2. Check migration status
./infra/scripts/migrate.sh status
```

---

## Migration Commands

| Command | Description |
|---------|-------------|
| `./infra/scripts/migrate.sh up` | Run pending migrations |
| `./infra/scripts/migrate.sh down` | Rollback last batch |
| `./infra/scripts/migrate.sh status` | Show executed and pending migrations |
| `./infra/scripts/migrate.sh fresh` | Drop all tables and re-run (dev only) |

---

## Current Migrations

| File | Description |
|------|-------------|
| `00000000_000_create_migrations_table.sql` | System table for tracking migrations |
| `20260103_001_create_users_table.sql` | Users table with authentication fields |

---

## Creating New Migrations

**Naming Convention:**
```
YYYYMMDD_NNN_description.sql          ← Forward migration
YYYYMMDD_NNN_rollback_description.sql ← Rollback migration
```

**Example:**

Forward: `20260104_002_create_roles_table.sql`
```sql
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Rollback: `20260104_002_rollback_roles_table.sql`
```sql
DROP TABLE IF EXISTS roles;
```

---

## Best Practices

1. ✅ **Always create rollback scripts** for every migration
2. ✅ **Test migrations** in development before production
3. ✅ **Never modify** existing migration files after execution
4. ✅ **Use sequential numbering** to ensure proper order
5. ✅ **Include comments** in SQL files for complex operations
6. ✅ **Use InnoDB** engine for all tables
7. ✅ **Use utf8mb4** charset for full Unicode support

---

For complete documentation, see [DEVELOPMENT.md](../../DEVELOPMENT.md).

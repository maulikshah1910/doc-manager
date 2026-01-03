# Database Seeds

Seed files for populating the database with initial data for development and testing.

---

## Quick Start

```bash
# Run all seed files
./infra/scripts/seed.sh

# Or use npm script
npm run db:seed
```

---

## Seed Files

### 001_seed_users.sql

Creates 6 initial user accounts for development:

| Email | Name | Password | Role (Future) |
|-------|------|----------|---------------|
| admin@example.com | Admin User | password123 | Admin |
| maulik@example.com | Maulik Shah | password123 | Admin |
| manager@example.com | Manager User | password123 | Manager |
| employee@example.com | Employee User | password123 | Employee |
| john.doe@example.com | John Doe | password123 | Employee |
| jane.smith@example.com | Jane Smith | password123 | Employee |

**Features:**
- Uses `INSERT ... ON DUPLICATE KEY UPDATE` for idempotency
- Passwords are bcrypt hashed (10 rounds)
- Can be run multiple times safely (will update existing records)

---

## Commands

```bash
# Run all seeds
./infra/scripts/seed.sh all

# Run specific seed
./infra/scripts/seed.sh users

# List available seeds
./infra/scripts/seed.sh list
```

---

## Creating New Seeds

### 1. Generate Password Hash

```bash
# Generate hash for your password
node infra/scripts/generate-password-hash.js "your-password"

# Or use npm script
npm run password:hash "your-password"
```

### 2. Create Seed File

**Naming:** `NNN_seed_description.sql`

**Example:** `002_seed_roles.sql`

```sql
-- Seed: Initial Roles
-- Created: 2026-01-03
-- Description: Create default roles for the system

INSERT INTO roles (id, name, description, created_at, updated_at)
VALUES (
    1,
    'admin',
    'Full system access',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    updated_at = CURRENT_TIMESTAMP;

-- Add more roles...
```

### 3. Run Your Seed

```bash
./infra/scripts/seed.sh roles
```

---

## Best Practices

1. ✅ **Use `ON DUPLICATE KEY UPDATE`** for idempotency
2. ✅ **Include explicit IDs** for reference data (roles, permissions)
3. ✅ **Hash passwords** using the password generator script
4. ✅ **Add comments** explaining what each seed does
5. ✅ **Test seeds** can be run multiple times without errors
6. ✅ **Sequential numbering** for execution order (001, 002, 003...)

---

## Idempotent Seeds

Seeds should be safe to run multiple times. Use this pattern:

```sql
INSERT INTO table_name (id, column1, column2)
VALUES (1, 'value1', 'value2')
ON DUPLICATE KEY UPDATE
    column1 = VALUES(column1),
    column2 = VALUES(column2),
    updated_at = CURRENT_TIMESTAMP;
```

This will:
- **Insert** the record if it doesn't exist
- **Update** the record if it already exists (based on PRIMARY KEY or UNIQUE constraint)

---

## Security Note

**⚠️ WARNING:** The default password (`password123`) and seed data are for **DEVELOPMENT ONLY**.

**In production:**
1. Change all default passwords
2. Remove or modify seed files
3. Use strong, unique passwords
4. Never commit production credentials to git

---

For complete documentation, see [DEVELOPMENT.md](../../../DEVELOPMENT.md).

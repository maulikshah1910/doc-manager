-- Seed: Initial Users
-- Created: 2026-01-03
-- Description: Create initial user accounts for development and testing

-- Note: Passwords are bcrypt hashed with 10 rounds
-- All users have password: "password123" (change in production!)
-- Hash generated using: node infra/scripts/generate-password-hash.js "password123"

-- Check if user exists, if yes update, if no insert
-- Email: admin@example.com | Password: password123
INSERT INTO users (id, first_name, last_name, email, password, status, created_at, updated_at)
VALUES (
    1,
    'Admin',
    'User',
    'admin@example.com',
    '$2a$10$pv1.aQvsxxA4iQ0km4FMXedrBF3zZUy30088ZVN4l5TXnqhPoP7wC', -- password123
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    password = VALUES(password),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

-- Email: maulik@example.com | Password: password123
INSERT INTO users (id, first_name, last_name, email, password, status, created_at, updated_at)
VALUES (
    2,
    'Maulik',
    'Shah',
    'maulik@example.com',
    '$2a$10$pv1.aQvsxxA4iQ0km4FMXedrBF3zZUy30088ZVN4l5TXnqhPoP7wC', -- password123
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    password = VALUES(password),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

-- Email: manager@example.com | Password: password123
INSERT INTO users (id, first_name, last_name, email, password, status, created_at, updated_at)
VALUES (
    3,
    'Manager',
    'User',
    'manager@example.com',
    '$2a$10$pv1.aQvsxxA4iQ0km4FMXedrBF3zZUy30088ZVN4l5TXnqhPoP7wC', -- password123
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    password = VALUES(password),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

-- Email: employee@example.com | Password: password123
INSERT INTO users (id, first_name, last_name, email, password, status, created_at, updated_at)
VALUES (
    4,
    'Employee',
    'User',
    'employee@example.com',
    '$2a$10$pv1.aQvsxxA4iQ0km4FMXedrBF3zZUy30088ZVN4l5TXnqhPoP7wC', -- password123
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    password = VALUES(password),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

-- Email: john.doe@example.com | Password: password123
INSERT INTO users (id, first_name, last_name, email, password, status, created_at, updated_at)
VALUES (
    5,
    'John',
    'Doe',
    'john.doe@example.com',
    '$2a$10$pv1.aQvsxxA4iQ0km4FMXedrBF3zZUy30088ZVN4l5TXnqhPoP7wC', -- password123
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    password = VALUES(password),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

-- Email: jane.smith@example.com | Password: password123
INSERT INTO users (id, first_name, last_name, email, password, status, created_at, updated_at)
VALUES (
    6,
    'Jane',
    'Smith',
    'jane.smith@example.com',
    '$2a$10$pv1.aQvsxxA4iQ0km4FMXedrBF3zZUy30088ZVN4l5TXnqhPoP7wC', -- password123
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    password = VALUES(password),
    status = VALUES(status),
    updated_at = CURRENT_TIMESTAMP;

-- Display seeded users
SELECT
    id,
    CONCAT(first_name, ' ', last_name) AS name,
    email,
    status,
    created_at
FROM users
WHERE id IN (1, 2, 3, 4, 5, 6)
ORDER BY id;

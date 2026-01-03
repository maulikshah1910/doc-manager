-- Migration: Add role_id to users table
-- Created: 2026-01-03
-- Description: Add foreign key to roles table (one role per user)

ALTER TABLE users
    ADD COLUMN role_id BIGINT UNSIGNED NULL COMMENT 'User role - only one role per user' AFTER status,
    ADD CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    ADD INDEX idx_role_id (role_id);

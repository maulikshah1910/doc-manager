-- Rollback: Remove role_id from users table
-- Created: 2026-01-03

ALTER TABLE users
    DROP FOREIGN KEY fk_users_role,
    DROP INDEX idx_role_id,
    DROP COLUMN role_id;

-- Migration: Create role_permissions junction table
-- Created: 2026-01-03
-- Description: Many-to-many relationship between roles and permissions

CREATE TABLE role_permissions (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Foreign Keys
    role_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to roles table',
    permission_id BIGINT UNSIGNED NOT NULL COMMENT 'Reference to permissions table',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Key Constraints
    CONSTRAINT fk_role_permissions_role
        FOREIGN KEY (role_id) REFERENCES roles(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_role_permissions_permission
        FOREIGN KEY (permission_id) REFERENCES permissions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    -- Unique Constraint (prevent duplicate role-permission pairs)
    UNIQUE KEY uk_role_permission (role_id, permission_id),

    -- Indexes
    INDEX idx_role_id (role_id),
    INDEX idx_permission_id (permission_id)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Junction table mapping roles to permissions';

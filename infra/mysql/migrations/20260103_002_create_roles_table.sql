-- Migration: Create roles table
-- Created: 2026-01-03
-- Description: RBAC roles table for user access control

CREATE TABLE roles (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Role Information
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Role name (e.g., admin, manager, employee)',
    display_name VARCHAR(100) NOT NULL COMMENT 'Human-readable role name',
    description TEXT NULL COMMENT 'Detailed description of the role and its purpose',

    -- Role Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this role is currently active',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_name (name),
    INDEX idx_is_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User roles for RBAC access control';

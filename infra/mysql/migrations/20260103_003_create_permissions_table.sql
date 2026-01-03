-- Migration: Create permissions table
-- Created: 2026-01-03
-- Description: RBAC permissions table for granular access control

CREATE TABLE permissions (
    -- Primary Key
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Permission Information
    name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Permission identifier (e.g., documents.create, users.delete)',
    display_name VARCHAR(150) NOT NULL COMMENT 'Human-readable permission name',
    description TEXT NULL COMMENT 'Detailed description of what this permission grants',

    -- Permission Grouping
    module VARCHAR(50) NOT NULL COMMENT 'Module/resource this permission belongs to (e.g., documents, users, reports)',

    -- Permission Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Whether this permission is currently active',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_name (name),
    INDEX idx_module (module),
    INDEX idx_is_active (is_active)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Permissions for RBAC access control';

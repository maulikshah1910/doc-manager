-- Migration: Create migrations tracking table
-- Created: 2026-01-03
-- Description: System table to track which migrations have been applied

CREATE TABLE IF NOT EXISTS _migrations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Migration file name without extension',
    batch INT UNSIGNED NOT NULL COMMENT 'Batch number for grouping migrations',
    executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When this migration was executed',

    INDEX idx_batch (batch),
    INDEX idx_executed_at (executed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks executed database migrations';

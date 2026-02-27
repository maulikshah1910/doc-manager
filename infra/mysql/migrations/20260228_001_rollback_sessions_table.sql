-- =========================================================
-- Rollback: Drop sessions table
-- =========================================================

DROP TABLE IF EXISTS sessions;

DELETE FROM migrations WHERE migration_name = '20260228_001_create_sessions_table';

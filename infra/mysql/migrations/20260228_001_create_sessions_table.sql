-- =========================================================
-- Migration: Create sessions table for refresh token storage
-- =========================================================

CREATE TABLE IF NOT EXISTS sessions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  VARCHAR(255)    NOT NULL,
  expires_at  TIMESTAMP       NOT NULL,
  revoked_at  TIMESTAMP       NULL DEFAULT NULL,
  user_agent  VARCHAR(500)    NULL,
  ip_address  VARCHAR(45)     NULL,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_token_hash (token_hash),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

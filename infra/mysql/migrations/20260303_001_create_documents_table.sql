-- =========================================================
-- Migration: Create documents and document_versions tables
-- =========================================================

CREATE TABLE IF NOT EXISTS documents (
  id              CHAR(36)        NOT NULL PRIMARY KEY,         -- UUID
  title           VARCHAR(255)    NOT NULL,
  description     TEXT            NULL,
  file_name       VARCHAR(255)    NOT NULL,                     -- original file name
  mime_type       VARCHAR(100)    NOT NULL,
  file_size       BIGINT UNSIGNED NOT NULL,                     -- bytes
  storage_path    VARCHAR(500)    NOT NULL,                     -- relative path on disk
  current_version SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  uploaded_by_id  BIGINT UNSIGNED NOT NULL,
  created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP       NULL DEFAULT NULL,

  INDEX idx_documents_uploaded_by (uploaded_by_id),
  INDEX idx_documents_deleted_at  (deleted_at),
  CONSTRAINT fk_documents_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS document_versions (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id CHAR(36)        NOT NULL,
  version     SMALLINT UNSIGNED NOT NULL,
  file_name   VARCHAR(255)    NOT NULL,
  mime_type   VARCHAR(100)    NOT NULL,
  file_size   BIGINT UNSIGNED NOT NULL,
  storage_path VARCHAR(500)   NOT NULL,
  uploaded_by_id BIGINT UNSIGNED NOT NULL,
  created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uq_document_version (document_id, version),
  INDEX idx_doc_versions_document_id (document_id),
  CONSTRAINT fk_doc_versions_document FOREIGN KEY (document_id)  REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_versions_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users(id)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

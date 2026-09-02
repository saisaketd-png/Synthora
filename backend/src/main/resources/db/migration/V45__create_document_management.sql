-- V45: Document Management, Lineage, Versioning, and Cryptographic Integrity Schema Enhancements

-- 1. Add lineage, versioning, cryptographic checksum, description and soft-active status columns to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_group_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS checksum VARCHAR(64);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. Backfill existing records to ensure deterministic lineage and active version status
UPDATE documents SET document_group_id = id WHERE document_group_id IS NULL;
UPDATE documents SET version = 1 WHERE version IS NULL;
UPDATE documents SET is_active = TRUE WHERE is_active IS NULL;

-- 3. Create high-performance indexes for lineage, active filtering, and category lookups
CREATE INDEX IF NOT EXISTS idx_documents_group ON documents(document_group_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner_active ON documents(owner_type, owner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

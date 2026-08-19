-- V28__add_supplier_offering_moderation.sql
-- Add moderation status and moderation notes to supplier offerings for Phase I.8.6E

ALTER TABLE supplier_offerings
ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
ADD COLUMN IF NOT EXISTS moderation_notes TEXT;

-- Default existing offerings to APPROVED for backward compatibility
UPDATE supplier_offerings
SET moderation_status = 'APPROVED'
WHERE moderation_status IS NULL OR moderation_status = 'PENDING_REVIEW';

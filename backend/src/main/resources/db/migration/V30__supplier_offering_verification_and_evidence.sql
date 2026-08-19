-- V30: SupplierOffering Verification, Field-Level Evidence & Audit Schema Enhancements

-- 1. Add verification & due diligence columns to supplier_offerings table
ALTER TABLE supplier_offerings ADD COLUMN IF NOT EXISTS offering_verification_status VARCHAR(50) DEFAULT 'UNVERIFIED';
ALTER TABLE supplier_offerings ADD COLUMN IF NOT EXISTS completeness_score INT DEFAULT 0;
ALTER TABLE supplier_offerings ADD COLUMN IF NOT EXISTS admin_request_info_notes TEXT;
ALTER TABLE supplier_offerings ADD COLUMN IF NOT EXISTS supplier_response_notes TEXT;
ALTER TABLE supplier_offerings ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE supplier_offerings ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id);

-- 2. Create supplier_offering_verification_evidences table for field-level checklist persistence
CREATE TABLE IF NOT EXISTS supplier_offering_verification_evidences (
    id UUID PRIMARY KEY,
    offering_id UUID NOT NULL REFERENCES supplier_offerings(id) ON DELETE CASCADE,
    verification_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED',
    evidence_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_offering_verification_item UNIQUE (offering_id, verification_type)
);

-- 3. Create supplier_offering_audits table for immutable governance audit history
CREATE TABLE IF NOT EXISTS supplier_offering_audits (
    id UUID PRIMARY KEY,
    offering_id UUID NOT NULL REFERENCES supplier_offerings(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id),
    admin_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    field_name VARCHAR(100),
    previous_value TEXT,
    new_value TEXT,
    reason TEXT,
    timestamp TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offering_evidences_offering ON supplier_offering_verification_evidences(offering_id);
CREATE INDEX IF NOT EXISTS idx_offering_audits_offering ON supplier_offering_audits(offering_id);

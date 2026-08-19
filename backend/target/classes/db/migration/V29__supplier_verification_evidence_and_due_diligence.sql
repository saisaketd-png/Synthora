-- V29: Enterprise Supplier Due-Diligence & Evidence Verification Schema Enhancements

-- 1. Add enterprise profile & verification request/response columns to suppliers table
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_type VARCHAR(100) DEFAULT 'MANUFACTURER';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS registered_address TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS state_province VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_email VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_phone VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_vat_number VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_registration_number VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS countries_served TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS primary_categories TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS admin_request_info_notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS supplier_response_notes TEXT;

-- 2. Add document due-diligence and expiry attributes to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS issuing_authority VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'ACTIVE';

-- 3. Create supplier_verification_evidences table for field-level checklist persistence
CREATE TABLE IF NOT EXISTS supplier_verification_evidences (
    id UUID PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    verification_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED',
    evidence_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_supplier_verification_item UNIQUE (supplier_id, verification_type)
);

CREATE INDEX IF NOT EXISTS idx_supplier_verification_evidences_supplier ON supplier_verification_evidences(supplier_id);
CREATE INDEX IF NOT EXISTS idx_documents_expiry_date ON documents(expiry_date);

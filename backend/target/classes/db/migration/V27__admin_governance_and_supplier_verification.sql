-- V27: Admin Governance Audit Logs, Supplier Verification Orchestration, and Product Request Information Loops

-- 1. Create governance_audit_logs table
CREATE TABLE governance_audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID NOT NULL REFERENCES users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    reason TEXT,
    timestamp TIMESTAMP NOT NULL
);

-- 2. Add verification orchestration columns to suppliers table
ALTER TABLE suppliers ADD COLUMN verification_status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE suppliers ADD COLUMN verification_notes TEXT;
ALTER TABLE suppliers ADD COLUMN verification_updated_at TIMESTAMP;

-- 3. Create supplier_verification_audits table
CREATE TABLE supplier_verification_audits (
    id UUID PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES users(id),
    admin_name VARCHAR(255) NOT NULL,
    previous_status VARCHAR(50) NOT NULL,
    new_status VARCHAR(50) NOT NULL,
    notes TEXT,
    timestamp TIMESTAMP NOT NULL
);

-- 4. Add information request and response columns to product_requests table
ALTER TABLE product_requests ADD COLUMN admin_request_notes TEXT;
ALTER TABLE product_requests ADD COLUMN supplier_response_notes TEXT;

-- Index for fast audit and search lookups
CREATE INDEX idx_governance_audit_entity ON governance_audit_logs(entity_type, entity_id);
CREATE INDEX idx_governance_audit_timestamp ON governance_audit_logs(timestamp);
CREATE INDEX idx_supplier_verification_audits_supplier ON supplier_verification_audits(supplier_id);

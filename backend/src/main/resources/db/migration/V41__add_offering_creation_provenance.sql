-- V41: Add offering creation provenance for Phase 1.10 (Admin Catalog & Supplier Offering Management)

ALTER TABLE supplier_offerings
ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(50) DEFAULT 'SUPPLIER',
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS created_by_admin_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_supplier_offerings_created_by_role ON supplier_offerings(created_by_role);

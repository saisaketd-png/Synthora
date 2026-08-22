-- Flyway migration V37: Enhance purchase_orders schema for MasterProduct snapshots, references and full lifecycle tracking

-- 1. Make legacy product_id nullable for canonical MasterProduct purchase orders
ALTER TABLE purchase_orders ALTER COLUMN product_id DROP NOT NULL;

-- 2. Add MasterProduct and SupplierOffering snapshot references
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS master_product_code VARCHAR(50),
    ADD COLUMN IF NOT EXISTS supplier_offering_id UUID REFERENCES supplier_offerings(id) ON DELETE SET NULL;

-- 3. Add procurement and quotation traceability references
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS rfq_reference VARCHAR(50),
    ADD COLUMN IF NOT EXISTS quotation_reference VARCHAR(50),
    ADD COLUMN IF NOT EXISTS quotation_version INTEGER;

-- 4. Add commercial specification and terms snapshot
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS purity NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS grade VARCHAR(50),
    ADD COLUMN IF NOT EXISTS packaging VARCHAR(255),
    ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100),
    ADD COLUMN IF NOT EXISTS delivery_terms VARCHAR(100),
    ADD COLUMN IF NOT EXISTS incoterms VARCHAR(50);

-- 5. Add lifecycle audit and cancellation tracking columns
ALTER TABLE purchase_orders
    ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100),
    ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- 6. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_po_master_product ON purchase_orders(master_product_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier_offering ON purchase_orders(supplier_offering_id);

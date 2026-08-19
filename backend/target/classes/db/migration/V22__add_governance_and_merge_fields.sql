-- Flyway migration V22: Add Governance and Merge Fields for Master Catalog Administration

ALTER TABLE product_requests
    ADD COLUMN rejection_reason TEXT,
    ADD COLUMN reviewed_by UUID REFERENCES users(id),
    ADD COLUMN reviewed_at TIMESTAMP;

ALTER TABLE master_products
    ADD COLUMN merged_into_master_product_id UUID REFERENCES master_products(id),
    ADD COLUMN deactivated_at TIMESTAMP,
    ADD COLUMN deactivated_by UUID REFERENCES users(id);

CREATE INDEX idx_master_products_merged_into ON master_products(merged_into_master_product_id);

-- Flyway migration V23: Explicit Legacy Product to MasterProduct and SupplierOffering Mapping Table

CREATE TABLE product_master_mappings (
    id UUID PRIMARY KEY,
    legacy_product_id UUID NOT NULL UNIQUE REFERENCES products(id),
    master_product_id UUID NOT NULL REFERENCES master_products(id),
    supplier_offering_id UUID REFERENCES supplier_offerings(id),
    mapping_status VARCHAR(50) NOT NULL DEFAULT 'AUTO_MIGRATED',
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_pmm_legacy_product ON product_master_mappings(legacy_product_id);
CREATE INDEX idx_pmm_master_product ON product_master_mappings(master_product_id);
CREATE INDEX idx_pmm_supplier_offering ON product_master_mappings(supplier_offering_id);
CREATE INDEX idx_pmm_mapping_status ON product_master_mappings(mapping_status);

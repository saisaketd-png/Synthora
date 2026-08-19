-- Flyway migration V24: Canonical MasterProduct Images and SupplierOffering Commercial Images Tables

CREATE TABLE master_product_images (
    id UUID PRIMARY KEY,
    master_product_id UUID NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    alt_text VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_mpi_master_product ON master_product_images(master_product_id);
CREATE INDEX idx_mpi_status ON master_product_images(status);

CREATE TABLE supplier_offering_images (
    id UUID PRIMARY KEY,
    supplier_offering_id UUID NOT NULL REFERENCES supplier_offerings(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    alt_text VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_soi_supplier_offering ON supplier_offering_images(supplier_offering_id);
CREATE INDEX idx_soi_status ON supplier_offering_images(status);

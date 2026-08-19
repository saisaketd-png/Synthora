-- Flyway migration V20: Master Product and Supplier Offering Foundation Tables

CREATE TABLE master_products (
    id UUID PRIMARY KEY,
    master_product_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    cas_number VARCHAR(100),
    molecular_formula VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_master_products_code ON master_products(master_product_code);
CREATE INDEX idx_master_products_cas ON master_products(cas_number);
CREATE INDEX idx_master_products_category ON master_products(category);
CREATE INDEX idx_master_products_status ON master_products(status);

CREATE TABLE supplier_offerings (
    id UUID PRIMARY KEY,
    master_product_id UUID NOT NULL REFERENCES master_products(id),
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    price NUMERIC(18,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    stock INTEGER NOT NULL DEFAULT 0,
    purity NUMERIC(5,2),
    grade VARCHAR(100),
    moq_kg NUMERIC(12,2),
    packaging VARCHAR(150),
    lead_time_days INTEGER,
    coa_available BOOLEAN DEFAULT FALSE,
    msds_available BOOLEAN DEFAULT FALSE,
    export_ready BOOLEAN DEFAULT FALSE,
    availability_status VARCHAR(50) DEFAULT 'AVAILABLE',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_supplier_master_product_offering UNIQUE (master_product_id, supplier_id)
);

CREATE INDEX idx_supplier_offerings_master_product ON supplier_offerings(master_product_id);
CREATE INDEX idx_supplier_offerings_supplier ON supplier_offerings(supplier_id);
CREATE INDEX idx_supplier_offerings_status ON supplier_offerings(availability_status);
CREATE INDEX idx_supplier_offerings_composite ON supplier_offerings(master_product_id, supplier_id);

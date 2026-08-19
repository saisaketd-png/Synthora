-- Flyway migration V21: Product Requests Table for Uncatalogued Chemical Proposals

CREATE TABLE product_requests (
    id UUID PRIMARY KEY,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    proposed_name VARCHAR(255) NOT NULL,
    cas_number VARCHAR(100),
    molecular_formula VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    description TEXT,
    supplier_message TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW',
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_product_requests_supplier ON product_requests(supplier_id);
CREATE INDEX idx_product_requests_status ON product_requests(status);
CREATE INDEX idx_product_requests_cas ON product_requests(cas_number);

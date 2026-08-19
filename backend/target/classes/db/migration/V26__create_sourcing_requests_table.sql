-- Flyway migration V26: Create sourcing_requests table and link to rfqs

CREATE TABLE sourcing_requests (
    id UUID PRIMARY KEY,
    sourcing_request_reference VARCHAR(30) UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id),
    master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    target_quantity NUMERIC(18,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    expires_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE rfqs ADD COLUMN sourcing_request_id UUID REFERENCES sourcing_requests(id) ON DELETE SET NULL;
ALTER TABLE rfqs ADD COLUMN sourcing_request_reference VARCHAR(30);
ALTER TABLE rfqs ADD COLUMN expires_at TIMESTAMP;

CREATE INDEX idx_sourcing_requests_buyer ON sourcing_requests(buyer_id);
CREATE INDEX idx_rfqs_sourcing_request ON rfqs(sourcing_request_id);

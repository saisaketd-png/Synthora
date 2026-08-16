CREATE TABLE quotations (
    id UUID PRIMARY KEY,
    rfq_id UUID NOT NULL REFERENCES rfqs(id),
    quotation_version INTEGER NOT NULL,
    unit_price NUMERIC(18,4) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    minimum_order_quantity NUMERIC(18,4),
    lead_time_days INTEGER,
    validity_date DATE NOT NULL,
    packaging_details TEXT,
    commercial_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uk_rfq_version
        UNIQUE (rfq_id, quotation_version)
);

CREATE INDEX idx_quotations_rfq
    ON quotations(rfq_id);

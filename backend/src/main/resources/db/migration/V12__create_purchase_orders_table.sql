CREATE SEQUENCE IF NOT EXISTS purchase_order_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    rfq_id UUID UNIQUE NOT NULL REFERENCES rfqs(id),
    quotation_id UUID NOT NULL REFERENCES quotations(id),
    buyer_id UUID NOT NULL REFERENCES users(id),
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id),
    product_id UUID NOT NULL REFERENCES products(id),
    product_name VARCHAR(255),
    quantity NUMERIC(18,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price NUMERIC(18,4) NOT NULL,
    total_amount NUMERIC(18,4) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    agreed_lead_time_days INTEGER,
    shipping_address TEXT NOT NULL,
    billing_contact TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PLACED',
    placed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_po_buyer ON purchase_orders(buyer_id);
CREATE INDEX idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);
CREATE INDEX idx_po_rfq ON purchase_orders(rfq_id);

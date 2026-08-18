CREATE TABLE shipments (
    id UUID PRIMARY KEY,
    purchase_order_id UUID UNIQUE NOT NULL REFERENCES purchase_orders(id),
    carrier VARCHAR(100) NOT NULL,
    tracking_number VARCHAR(100) NOT NULL,
    estimated_delivery_date DATE,
    shipped_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

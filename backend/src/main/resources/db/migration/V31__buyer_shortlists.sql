-- V31: Buyer Shortlists Schema Migration

CREATE TABLE IF NOT EXISTS buyer_shortlists (
    id UUID PRIMARY KEY,
    buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_buyer_shortlist UNIQUE (buyer_id)
);

CREATE TABLE IF NOT EXISTS buyer_shortlist_items (
    id UUID PRIMARY KEY,
    shortlist_id UUID NOT NULL REFERENCES buyer_shortlists(id) ON DELETE CASCADE,
    master_product_id UUID NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
    supplier_offering_id UUID NOT NULL REFERENCES supplier_offerings(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_shortlist_offering UNIQUE (shortlist_id, supplier_offering_id)
);

CREATE INDEX IF NOT EXISTS idx_shortlist_buyer ON buyer_shortlists(buyer_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_items_shortlist ON buyer_shortlist_items(shortlist_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_items_offering ON buyer_shortlist_items(supplier_offering_id);

-- Flyway migration V25: Add master_product_id and supplier_offering_id to rfqs table

ALTER TABLE rfqs ADD COLUMN master_product_id UUID REFERENCES master_products(id) ON DELETE SET NULL;
ALTER TABLE rfqs ADD COLUMN supplier_offering_id UUID REFERENCES supplier_offerings(id) ON DELETE SET NULL;

CREATE INDEX idx_rfqs_master_product ON rfqs(master_product_id);
CREATE INDEX idx_rfqs_supplier_offering ON rfqs(supplier_offering_id);

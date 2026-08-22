-- Flyway migration V33: Master Product Synonyms Table

CREATE TABLE master_product_synonyms (
    id UUID PRIMARY KEY,
    master_product_id UUID NOT NULL REFERENCES master_products(id) ON DELETE CASCADE,
    synonym VARCHAR(255) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    status VARCHAR(50) NOT NULL DEFAULT 'APPROVED',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT chk_synonym_source CHECK (source IN ('OFFICIAL', 'SUPPLIER')),
    CONSTRAINT chk_synonym_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_mps_master_product ON master_product_synonyms(master_product_id);
CREATE INDEX idx_mps_synonym ON master_product_synonyms(synonym);
CREATE INDEX idx_mps_status ON master_product_synonyms(status);
CREATE INDEX idx_mps_lookup ON master_product_synonyms(master_product_id, status);
CREATE UNIQUE INDEX uk_mps_product_synonym_lower ON master_product_synonyms(master_product_id, LOWER(TRIM(synonym)));

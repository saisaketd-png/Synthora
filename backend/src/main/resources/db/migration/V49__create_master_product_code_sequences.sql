-- V49: Create master product code sequences table for sequential product code generation

CREATE TABLE IF NOT EXISTS master_product_code_sequences (
    prefix VARCHAR(20) PRIMARY KEY,
    next_value BIGINT NOT NULL
);

INSERT INTO master_product_code_sequences (prefix, next_value) VALUES
('API', 1),
('INT', 1),
('EXC', 1),
('SOL', 1),
('SPC', 1),
('LAB', 1),
('OTH', 1),
('CAT', 1)
ON CONFLICT (prefix) DO NOTHING;

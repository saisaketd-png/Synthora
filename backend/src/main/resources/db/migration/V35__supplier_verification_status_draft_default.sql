-- V35: Set default verification_status to DRAFT for new suppliers

ALTER TABLE suppliers ALTER COLUMN verification_status SET DEFAULT 'DRAFT';

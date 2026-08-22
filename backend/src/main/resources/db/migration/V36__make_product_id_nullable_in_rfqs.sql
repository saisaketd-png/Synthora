-- Flyway migration V36: Make product_id column nullable in rfqs table
ALTER TABLE rfqs ALTER COLUMN product_id DROP NOT NULL;

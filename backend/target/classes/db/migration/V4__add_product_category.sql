ALTER TABLE products
    ADD COLUMN category VARCHAR(50);

UPDATE products
SET category = 'API'
WHERE category IS NULL;

ALTER TABLE products
    ALTER COLUMN category SET NOT NULL;
-- Migration V18: Add product_code to products and create product_images table

-- 1. Add product_code column
ALTER TABLE products ADD COLUMN product_code VARCHAR(50);

-- 2. Backfill existing products with unique product_code
UPDATE products 
SET product_code = CONCAT('SYN-', SUBSTRING(CAST(id AS VARCHAR(36)), 1, 8)) 
WHERE product_code IS NULL;

-- 3. Set NOT NULL and add unique constraint/index
ALTER TABLE products ALTER COLUMN product_code SET NOT NULL;
CREATE UNIQUE INDEX idx_products_product_code ON products(product_code);

-- 4. Create product_images table
CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 0,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_images_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 5. Create indices for product images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_product_primary ON product_images(product_id, is_primary);

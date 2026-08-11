CREATE TABLE products (
                          id UUID PRIMARY KEY,
                          name VARCHAR(255) NOT NULL,
                          description VARCHAR(2000),
                          price NUMERIC(18,2) NOT NULL,
                          stock INTEGER NOT NULL,
                          created_at TIMESTAMP NOT NULL,
                          seller_id UUID NOT NULL,
                          CONSTRAINT fk_products_seller
                              FOREIGN KEY (seller_id)
                                  REFERENCES users(id)
);
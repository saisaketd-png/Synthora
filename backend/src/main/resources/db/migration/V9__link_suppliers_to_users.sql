ALTER TABLE suppliers
    ADD COLUMN user_id UUID;

ALTER TABLE suppliers
    ADD CONSTRAINT fk_supplier_user
        FOREIGN KEY (user_id)
        REFERENCES users(id);

CREATE UNIQUE INDEX uq_supplier_user
    ON suppliers(user_id)
    WHERE user_id IS NOT NULL;
CREATE TABLE rfqs (
                      id UUID PRIMARY KEY,
                      buyer_id UUID NOT NULL REFERENCES users(id),
                      product_id UUID NOT NULL REFERENCES products(id),
                      supplier_id BIGINT NOT NULL REFERENCES suppliers(id),

                      quantity NUMERIC(18,2) NOT NULL,
                      unit VARCHAR(20) NOT NULL,

                      message TEXT,

                      status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

                      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rfqs_buyer ON rfqs(buyer_id);
CREATE INDEX idx_rfqs_supplier ON rfqs(supplier_id);
CREATE INDEX idx_rfqs_product ON rfqs(product_id);
CREATE INDEX idx_rfqs_status ON rfqs(status);
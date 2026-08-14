CREATE TABLE suppliers (
                           id BIGSERIAL PRIMARY KEY,
                           name VARCHAR(255) NOT NULL,
                           slug VARCHAR(255) UNIQUE NOT NULL,
                           country_code VARCHAR(10),
                           country_name VARCHAR(100),
                           logo_url TEXT,
                           verified BOOLEAN DEFAULT FALSE,
                           years_in_business INTEGER,
                           response_rate INTEGER,
                           export_ready BOOLEAN DEFAULT FALSE,
                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_suppliers (
                                   id BIGSERIAL PRIMARY KEY,
                                   product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                   supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
                                   purity VARCHAR(100),
                                   grade VARCHAR(100),
                                   moq_kg NUMERIC(12,2),
                                   packaging VARCHAR(255),
                                   lead_time_days INTEGER,
                                   coa_available BOOLEAN DEFAULT FALSE,
                                   msds_available BOOLEAN DEFAULT FALSE,
                                   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_documents (
                                   id BIGSERIAL PRIMARY KEY,
                                   product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                                   document_type VARCHAR(50) NOT NULL,
                                   file_name VARCHAR(255) NOT NULL,
                                   file_url TEXT NOT NULL,
                                   uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
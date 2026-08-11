CREATE TABLE categories (
                            id UUID PRIMARY KEY,
                            name VARCHAR(100) NOT NULL UNIQUE,
                            slug VARCHAR(120) NOT NULL UNIQUE,
                            created_at TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP NOT NULL
);
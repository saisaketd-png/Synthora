CREATE TABLE seller_profiles (
                                 id UUID PRIMARY KEY,
                                 user_id UUID NOT NULL UNIQUE,
                                 company_name VARCHAR(150) NOT NULL,
                                 gst_number VARCHAR(50),
                                 address VARCHAR(500),
                                 city VARCHAR(100),
                                 state VARCHAR(100),
                                 country VARCHAR(100),
                                 website VARCHAR(200),
                                 certifications VARCHAR(500),
                                 about_company VARCHAR(2000),
                                 created_at TIMESTAMP NOT NULL,
                                 updated_at TIMESTAMP NOT NULL,
                                 CONSTRAINT fk_seller_profile_user
                                     FOREIGN KEY (user_id) REFERENCES users(id)
                                         ON DELETE CASCADE
);
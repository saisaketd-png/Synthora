CREATE TABLE documents (
    id UUID PRIMARY KEY,
    owner_type VARCHAR(30) NOT NULL,
    owner_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(500) UNIQUE NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_owner ON documents(owner_type, owner_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);

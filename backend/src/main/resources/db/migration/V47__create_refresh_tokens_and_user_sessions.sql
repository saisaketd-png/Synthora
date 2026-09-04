-- V47: Add sessions_invalidated_at to users and create refresh_tokens table for Phase C.2 session management

-- 1. Add sessions_invalidated_at column to users table for global logout / session termination
ALTER TABLE users
ADD COLUMN sessions_invalidated_at TIMESTAMP WITH TIME ZONE;

-- 2. Create refresh_tokens table supporting token families, strict rotation, and absolute session expiration
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    family_id UUID NOT NULL,
    session_absolute_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE NULL,
    replaced_by_token_id UUID NULL REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_ip VARCHAR(45) NULL,
    user_agent VARCHAR(500) NULL
);

-- 3. Indexes for fast token lookup, family revocation, and expiration queries
CREATE UNIQUE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_session_abs_exp ON refresh_tokens(session_absolute_expires_at);
CREATE INDEX idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at);

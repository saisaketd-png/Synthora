-- V40: Add email verification support and email_verification_tokens table

-- 1. Add email_verified_at timestamp column to users table
ALTER TABLE users
    ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE NULL;

-- 2. Backfill existing accounts so legacy users and admins remain verified
UPDATE users
    SET email_verified_at = COALESCE(created_at, NOW())
    WHERE email_verified_at IS NULL;

-- 3. Create dedicated email verification tokens table
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Indexes for fast token lookup and user token invalidation
CREATE UNIQUE INDEX idx_email_verification_tokens_hash ON email_verification_tokens (token_hash);
CREATE INDEX idx_email_verification_tokens_user ON email_verification_tokens (user_id);

-- Phase 2G.2: Audit Logging Foundation
-- Creates the immutable append-only audit_logs table for administrative oversight.

CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id      UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action        VARCHAR(60) NOT NULL,
    target_type   VARCHAR(40) NOT NULL,
    target_id     VARCHAR(100) NOT NULL,
    details       TEXT,
    ip_address    VARCHAR(45),
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for queries by administrator, newest first
CREATE INDEX idx_audit_logs_admin_created
    ON audit_logs(admin_id, created_at DESC);

-- Index for queries by specific action, newest first
CREATE INDEX idx_audit_logs_action_created
    ON audit_logs(action, created_at DESC);

-- Index for queries on a specific target entity (e.g. all history for a user, product, or supplier)
CREATE INDEX idx_audit_logs_target_created
    ON audit_logs(target_type, target_id, created_at DESC);

-- Index for global chronological audit timeline
CREATE INDEX idx_audit_logs_created
    ON audit_logs(created_at DESC);

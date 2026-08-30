-- V42__create_account_suspensions_and_appeals_tables.sql
-- Synthora Account Governance: User Suspension, Reinstatement & Formal Appeals Workflow (Phase 1.11)

-- 1. Account Suspensions History
CREATE TABLE IF NOT EXISTS account_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suspended_by_admin_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    internal_notes TEXT,
    suspended_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reinstated_at TIMESTAMP WITH TIME ZONE,
    reinstated_by_admin_id UUID REFERENCES users(id),
    reinstatement_notes TEXT
);

-- Indexes for account_suspensions
CREATE INDEX IF NOT EXISTS idx_account_suspensions_user_id ON account_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_account_suspensions_suspended_at ON account_suspensions(suspended_at);
CREATE INDEX IF NOT EXISTS idx_account_suspensions_suspended_by ON account_suspensions(suspended_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_account_suspensions_reinstated_at ON account_suspensions(reinstated_at);

-- 2. Account Suspension Appeals
CREATE TABLE IF NOT EXISTS account_suspension_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suspension_id UUID NOT NULL REFERENCES account_suspensions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    submitted_reason TEXT NOT NULL,
    user_response TEXT,
    admin_response TEXT,
    admin_internal_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by_admin_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for account_suspension_appeals
CREATE INDEX IF NOT EXISTS idx_suspension_appeals_suspension_id ON account_suspension_appeals(suspension_id);
CREATE INDEX IF NOT EXISTS idx_suspension_appeals_user_id ON account_suspension_appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_suspension_appeals_status ON account_suspension_appeals(status);
CREATE INDEX IF NOT EXISTS idx_suspension_appeals_created_at ON account_suspension_appeals(created_at);

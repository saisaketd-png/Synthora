-- V43: Create User Notification Preferences and enhance Notifications schema for Phase 1.14

-- 1. Enhance notifications table with priority and category
ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL',
    ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Backfill default categories based on existing types if null
UPDATE notifications SET category = 'RFQ' WHERE category IS NULL AND type LIKE 'RFQ%';
UPDATE notifications SET category = 'QUOTATION' WHERE category IS NULL AND (type LIKE 'QUOTATION%' OR type LIKE 'COUNTER_OFFER%');
UPDATE notifications SET category = 'PURCHASE_ORDER' WHERE category IS NULL AND (type LIKE 'PURCHASE_ORDER%' OR type LIKE 'PO_%');
UPDATE notifications SET category = 'SHIPMENT' WHERE category IS NULL AND (type LIKE 'ORDER_%');
UPDATE notifications SET category = 'SUPPLIER_VERIFICATION' WHERE category IS NULL AND (type LIKE 'SUPPLIER_VERIFICATION%' OR type LIKE 'VERIFICATION_%' OR type = 'SUPPLIER_VERIFIED' OR type = 'SUPPLIER_REJECTED' OR type = 'SUPPLIER_INFORMATION_REQUIRED');
UPDATE notifications SET category = 'CATALOG' WHERE category IS NULL AND (type LIKE 'MASTER_PRODUCT%' OR type LIKE 'PRODUCT_REQUEST%' OR type LIKE 'SUPPLIER_OFFERING%');
UPDATE notifications SET category = 'GOVERNANCE' WHERE category IS NULL AND (type LIKE 'USER_SUSPENDED' OR type LIKE 'USER_REINSTATED' OR type LIKE 'APPEAL_%' OR type LIKE 'SUPPLIER_SUSPENDED');
UPDATE notifications SET category = 'SYSTEM' WHERE category IS NULL;

-- 2. Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category       VARCHAR(50) NOT NULL,
    in_app_enabled BOOLEAN     NOT NULL DEFAULT TRUE,
    email_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_notif_pref_user_category UNIQUE (user_id, category)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_pref_user
    ON user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_category
    ON notifications(recipient_id, category);

CREATE INDEX IF NOT EXISTS idx_notifications_priority
    ON notifications(priority);

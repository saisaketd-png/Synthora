-- Phase 2F.2: Notification domain persistence
-- Creates the notifications table with recipient FK to users,
-- cascade delete, and indexes optimized for the three primary query
-- patterns identified in the Phase 2F.1 forensic audit.

CREATE TABLE notifications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(60) NOT NULL,
    title         VARCHAR(255) NOT NULL,
    message       TEXT        NOT NULL,
    entity_type   VARCHAR(50),
    entity_id     UUID,
    read          BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at       TIMESTAMP,
    created_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Primary retrieval: paginated notification list for a user, sorted newest first.
-- Covers: findByRecipientIdOrderByCreatedAtDesc and unread variant.
CREATE INDEX idx_notifications_recipient_read_created
    ON notifications(recipient_id, read, created_at DESC);

-- Unread count: partial index for fast COUNT(*) WHERE read = FALSE per recipient.
CREATE INDEX idx_notifications_recipient_unread
    ON notifications(recipient_id)
    WHERE read = FALSE;

-- Entity navigation: allows lookup of notifications linked to a specific entity
-- (e.g., all notifications for rfq_id = X across all recipients).
CREATE INDEX idx_notifications_entity
    ON notifications(entity_type, entity_id);

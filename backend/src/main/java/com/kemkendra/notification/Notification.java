package com.kemkendra.notification;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Persistent notification record.
 * <p>
 * A notification is always addressed to a specific {@code User} via
 * {@code recipientId}. The field is a raw UUID column (not a JPA relationship)
 * to keep the notification domain decoupled from the User aggregate, while the
 * database migration enforces {@code REFERENCES users(id) ON DELETE CASCADE}.
 * </p>
 *
 * <p>Security: all queries that read or mutate a notification must be scoped
 * to {@code (id, recipientId)} to prevent IDOR access. This is enforced in
 * Phase 2F.3 NotificationService.</p>
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /**
     * The User who should receive this notification.
     * Stored as a plain UUID to avoid cross-aggregate JPA coupling.
     * The database migration enforces a FK to users(id) ON DELETE CASCADE.
     */
    @Column(name = "recipient_id", nullable = false, updatable = false)
    private UUID recipientId;

    /**
     * The business event that triggered this notification.
     * Persisted as a STRING to allow adding new enum values without a schema migration.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 60, updatable = false)
    private NotificationType type;

    /**
     * Short human-readable subject line, displayed in the bell panel and email subject.
     */
    @Column(name = "title", nullable = false, length = 255, updatable = false)
    private String title;

    /**
     * Full notification message body.
     */
    @Column(name = "message", nullable = false, columnDefinition = "TEXT", updatable = false)
    private String message;

    /**
     * The category of the linked business entity (nullable — some notifications
     * may not relate to a specific entity).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", length = 50, updatable = false)
    private NotificationEntityType entityType;

    /**
     * The UUID of the linked business entity (nullable).
     * Used by the frontend to navigate: entityType + entityId → route.
     */
    @Column(name = "entity_id", updatable = false)
    private UUID entityId;

    /**
     * Whether the recipient has read this notification.
     * Defaults to {@code false} at creation.
     */
    @Column(name = "read", nullable = false)
    private boolean read = false;

    /**
     * Timestamp at which the notification was marked as read.
     * Null until the recipient reads it.
     */
    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * Creation timestamp. Set automatically in {@link #onCreate()} and never modified.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // -----------------------------------------------------------------------
    // Getters (all fields)
    // -----------------------------------------------------------------------

    public UUID getId() { return id; }

    public UUID getRecipientId() { return recipientId; }

    public NotificationType getType() { return type; }

    public String getTitle() { return title; }

    public String getMessage() { return message; }

    public NotificationEntityType getEntityType() { return entityType; }

    public UUID getEntityId() { return entityId; }

    public boolean isRead() { return read; }

    public LocalDateTime getReadAt() { return readAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    // -----------------------------------------------------------------------
    // Setters (mutable fields only)
    // Note: recipientId, type, title, message, entityType, entityId, createdAt
    // are immutable after creation — no setters provided for them here, but
    // the NotificationService (Phase 2F.3) will use a builder / constructor
    // approach. Direct field setters for mutable fields only:
    // -----------------------------------------------------------------------

    public void setRecipientId(UUID recipientId) { this.recipientId = recipientId; }

    public void setType(NotificationType type) { this.type = type; }

    public void setTitle(String title) { this.title = title; }

    public void setMessage(String message) { this.message = message; }

    public void setEntityType(NotificationEntityType entityType) { this.entityType = entityType; }

    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    /** Called by NotificationService when the recipient reads the notification. */
    public void setRead(boolean read) { this.read = read; }

    /** Called by NotificationService when marking as read. */
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
}

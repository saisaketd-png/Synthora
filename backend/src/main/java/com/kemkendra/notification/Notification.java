package com.kemkendra.notification;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Persistent notification record for KemKendra.
 * <p>
 * A notification is always addressed to a specific {@code User} via
 * {@code recipientId}.
 * </p>
 */
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "recipient_id", nullable = false, updatable = false)
    private UUID recipientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 60, updatable = false)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", length = 50)
    private NotificationCategory category = NotificationCategory.SYSTEM;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 20)
    private NotificationPriority priority = NotificationPriority.NORMAL;

    @Column(name = "title", nullable = false, length = 255, updatable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT", updatable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", length = 50, updatable = false)
    private NotificationEntityType entityType;

    @Column(name = "entity_id", updatable = false)
    private UUID entityId;

    @Column(name = "read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (category == null && type != null) {
            category = deriveCategoryFromType(type);
        }
        if (priority == null && type != null) {
            priority = derivePriorityFromType(type);
        }
    }

    public static NotificationCategory deriveCategoryFromType(NotificationType type) {
        if (type == null) return NotificationCategory.SYSTEM;
        String name = type.name();
        if (name.startsWith("RFQ")) return NotificationCategory.RFQ;
        if (name.startsWith("QUOTATION") || name.startsWith("COUNTER_OFFER")) return NotificationCategory.QUOTATION;
        if (name.startsWith("PURCHASE_ORDER") || name.startsWith("PO_")) return NotificationCategory.PURCHASE_ORDER;
        if (name.startsWith("ORDER_")) return NotificationCategory.SHIPMENT;
        if (name.startsWith("SUPPLIER_VERIFICATION") || name.startsWith("VERIFICATION_")
                || type == NotificationType.SUPPLIER_VERIFIED || type == NotificationType.SUPPLIER_REJECTED
                || type == NotificationType.SUPPLIER_INFORMATION_REQUIRED) {
            return NotificationCategory.SUPPLIER_VERIFICATION;
        }
        if (name.startsWith("MASTER_PRODUCT") || name.startsWith("PRODUCT_REQUEST") || name.startsWith("SUPPLIER_OFFERING")) {
            return NotificationCategory.CATALOG;
        }
        if (name.startsWith("USER_SUSPENDED") || name.startsWith("USER_REINSTATED")
                || name.startsWith("APPEAL_") || type == NotificationType.SUPPLIER_SUSPENDED) {
            return NotificationCategory.GOVERNANCE;
        }
        if (name.startsWith("DOCUMENT_")) return NotificationCategory.SYSTEM;
        return NotificationCategory.SYSTEM;
    }

    public static NotificationPriority derivePriorityFromType(NotificationType type) {
        if (type == null) return NotificationPriority.NORMAL;
        return switch (type) {
            case USER_SUSPENDED, SUPPLIER_SUSPENDED, APPEAL_REJECTED -> NotificationPriority.CRITICAL;
            case USER_REINSTATED, APPEAL_APPROVED, APPEAL_INFORMATION_REQUIRED,
                 SUPPLIER_INFORMATION_REQUIRED, VERIFICATION_INFO_REQUESTED,
                 SUPPLIER_REJECTED, SUPPLIER_OFFERING_FLAGGED, SUPPLIER_OFFERING_REJECTED,
                 PURCHASE_ORDER_CANCELLED, RFQ_CANCELLED -> NotificationPriority.HIGH;
            case ORDER_DELIVERED, RFQ_EXPIRED -> NotificationPriority.LOW;
            default -> NotificationPriority.NORMAL;
        };
    }

    // -----------------------------------------------------------------------
    // Getters and Setters
    // -----------------------------------------------------------------------

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRecipientId() { return recipientId; }
    public void setRecipientId(UUID recipientId) { this.recipientId = recipientId; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public NotificationCategory getCategory() { return category; }
    public void setCategory(NotificationCategory category) { this.category = category; }

    public NotificationPriority getPriority() { return priority; }
    public void setPriority(NotificationPriority priority) { this.priority = priority; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationEntityType getEntityType() { return entityType; }
    public void setEntityType(NotificationEntityType entityType) { this.entityType = entityType; }

    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

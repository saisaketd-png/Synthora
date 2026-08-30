package com.kemkendra.admin.audit;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Persistent immutable audit log record for administrative and moderation actions.
 * <p>
 * Decoupled from the User aggregate by storing a raw {@code adminId} UUID.
 * Append-only by design: no update or delete operations are permitted.
 * </p>
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    /**
     * The UUID of the administrator who performed the action.
     * Stored as a raw UUID to decouple the audit domain from the User entity.
     * The database migration enforces {@code REFERENCES users(id) ON DELETE RESTRICT}.
     */
    @Column(name = "admin_id", nullable = false, updatable = false)
    private UUID adminId;

    /**
     * The administrative action performed.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 60, updatable = false)
    private AuditAction action;

    /**
     * The target entity type.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false, length = 40, updatable = false)
    private AuditTargetType targetType;

    /**
     * The target entity's identifier (stored as String to support polymorphic entity IDs).
     */
    @Column(name = "target_id", nullable = false, length = 100, updatable = false)
    private String targetId;

    /**
     * Non-sensitive summary details or description of the administrative change.
     */
    @Column(name = "details", columnDefinition = "TEXT", updatable = false)
    private String details;

    /**
     * Client IP address of the administrator when the action was performed (IPv4 or IPv6).
     */
    @Column(name = "ip_address", length = 45, updatable = false)
    private String ipAddress;

    /**
     * Timestamp of the audit event. Set automatically on creation and immutable thereafter.
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public AuditLog() {
    }

    public AuditLog(
            UUID adminId,
            AuditAction action,
            AuditTargetType targetType,
            String targetId,
            String details,
            String ipAddress) {
        this.adminId = adminId;
        this.action = action;
        this.targetType = targetType;
        this.targetId = targetId;
        this.details = details;
        this.ipAddress = ipAddress;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // -----------------------------------------------------------------------
    // Getters (all fields are immutable)
    // -----------------------------------------------------------------------

    public UUID getId() {
        return id;
    }

    public UUID getAdminId() {
        return adminId;
    }

    public AuditAction getAction() {
        return action;
    }

    public AuditTargetType getTargetType() {
        return targetType;
    }

    public String getTargetId() {
        return targetId;
    }

    public String getDetails() {
        return details;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // -----------------------------------------------------------------------
    // Package-private setters for testing/framework purposes
    // -----------------------------------------------------------------------

    public void setAdminId(UUID adminId) {
        this.adminId = adminId;
    }

    public void setAction(AuditAction action) {
        this.action = action;
    }

    public void setTargetType(AuditTargetType targetType) {
        this.targetType = targetType;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

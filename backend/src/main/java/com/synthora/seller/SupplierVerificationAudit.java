package com.synthora.seller;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "supplier_verification_audits")
public class SupplierVerificationAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "supplier_id", nullable = false)
    private Long supplierId;

    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    @Column(name = "admin_name", nullable = false)
    private String adminName;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", nullable = false)
    private SupplierVerificationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    private SupplierVerificationStatus newStatus;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public SupplierVerificationAudit() {
        this.timestamp = LocalDateTime.now();
    }

    public SupplierVerificationAudit(Long supplierId, UUID adminId, String adminName, SupplierVerificationStatus previousStatus, SupplierVerificationStatus newStatus, String notes) {
        this.supplierId = supplierId;
        this.adminId = adminId;
        this.adminName = adminName;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        this.notes = notes;
        this.timestamp = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public UUID getAdminId() { return adminId; }
    public void setAdminId(UUID adminId) { this.adminId = adminId; }
    public String getAdminName() { return adminName; }
    public void setAdminName(String adminName) { this.adminName = adminName; }
    public SupplierVerificationStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(SupplierVerificationStatus previousStatus) { this.previousStatus = previousStatus; }
    public SupplierVerificationStatus getNewStatus() { return newStatus; }
    public void setNewStatus(SupplierVerificationStatus newStatus) { this.newStatus = newStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}

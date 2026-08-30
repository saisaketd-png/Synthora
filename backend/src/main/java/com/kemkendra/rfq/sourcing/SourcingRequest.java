package com.kemkendra.rfq.sourcing;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "sourcing_requests")
public class SourcingRequest {

    @Id
    private UUID id;

    @Column(name = "sourcing_request_reference", nullable = false, unique = true, length = 30)
    private String sourcingRequestReference;

    @Column(name = "buyer_id", nullable = false)
    private UUID buyerId;

    @Column(name = "master_product_id")
    private UUID masterProductId;

    @Column(name = "product_id")
    private UUID productId;

    @Column(name = "target_quantity", nullable = false, precision = 18, scale = 2)
    private BigDecimal targetQuantity;

    @Column(nullable = false, length = 20)
    private String unit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SourcingRequestStatus status;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (status == null) {
            status = SourcingRequestStatus.OPEN;
        }
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (sourcingRequestReference == null) {
            String prefix = id.toString().substring(0, 8).toUpperCase();
            sourcingRequestReference = String.format("SRQ-%d-%s", createdAt.getYear(), prefix);
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getSourcingRequestReference() {
        return sourcingRequestReference;
    }

    public void setSourcingRequestReference(String sourcingRequestReference) {
        this.sourcingRequestReference = sourcingRequestReference;
    }

    public UUID getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(UUID buyerId) {
        this.buyerId = buyerId;
    }

    public UUID getMasterProductId() {
        return masterProductId;
    }

    public void setMasterProductId(UUID masterProductId) {
        this.masterProductId = masterProductId;
    }

    public UUID getProductId() {
        return productId;
    }

    public void setProductId(UUID productId) {
        this.productId = productId;
    }

    public BigDecimal getTargetQuantity() {
        return targetQuantity;
    }

    public void setTargetQuantity(BigDecimal targetQuantity) {
        this.targetQuantity = targetQuantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public SourcingRequestStatus getStatus() {
        return status;
    }

    public void setStatus(SourcingRequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

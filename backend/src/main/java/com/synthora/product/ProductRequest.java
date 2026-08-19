package com.synthora.product;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_requests")
public class ProductRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "proposed_name", nullable = false)
    private String proposedName;

    @Column(name = "cas_number", length = 100)
    private String casNumber;

    @Column(name = "molecular_formula", length = 100)
    private String molecularFormula;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private ProductCategory category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "supplier_message", columnDefinition = "TEXT")
    private String supplierMessage;

    @Column(nullable = false, length = 50)
    private String status = "PENDING_REVIEW";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "admin_request_notes", columnDefinition = "TEXT")
    private String adminRequestNotes;

    @Column(name = "supplier_response_notes", columnDefinition = "TEXT")
    private String supplierResponseNotes;

    public String getAdminRequestNotes() { return adminRequestNotes; }
    public void setAdminRequestNotes(String adminRequestNotes) { this.adminRequestNotes = adminRequestNotes; }
    public String getSupplierResponseNotes() { return supplierResponseNotes; }
    public void setSupplierResponseNotes(String supplierResponseNotes) { this.supplierResponseNotes = supplierResponseNotes; }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private com.synthora.identity.User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ProductRequest() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Supplier getSupplier() {
        return supplier;
    }

    public void setSupplier(Supplier supplier) {
        this.supplier = supplier;
    }

    public String getProposedName() {
        return proposedName;
    }

    public void setProposedName(String proposedName) {
        this.proposedName = proposedName;
    }

    public String getCasNumber() {
        return casNumber;
    }

    public void setCasNumber(String casNumber) {
        this.casNumber = casNumber;
    }

    public String getMolecularFormula() {
        return molecularFormula;
    }

    public void setMolecularFormula(String molecularFormula) {
        this.molecularFormula = molecularFormula;
    }

    public ProductCategory getCategory() {
        return category;
    }

    public void setCategory(ProductCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSupplierMessage() {
        return supplierMessage;
    }

    public void setSupplierMessage(String supplierMessage) {
        this.supplierMessage = supplierMessage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

    public com.synthora.identity.User getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(com.synthora.identity.User reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

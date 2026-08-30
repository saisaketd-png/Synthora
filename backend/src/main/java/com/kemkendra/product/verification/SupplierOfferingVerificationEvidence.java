package com.kemkendra.product.verification;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "supplier_offering_verification_evidences")
public class SupplierOfferingVerificationEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "offering_id", nullable = false)
    private UUID offeringId;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_type", nullable = false)
    private OfferingVerificationType verificationType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OfferingEvidenceStatus status = OfferingEvidenceStatus.UNVERIFIED;

    @Column(name = "evidence_document_id")
    private UUID evidenceDocumentId;

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public SupplierOfferingVerificationEvidence() {
    }

    public SupplierOfferingVerificationEvidence(UUID offeringId, OfferingVerificationType verificationType, OfferingEvidenceStatus status) {
        this.offeringId = offeringId;
        this.verificationType = verificationType;
        this.status = status;
    }

    public UUID getId() { return id; }
    public UUID getOfferingId() { return offeringId; }
    public void setOfferingId(UUID offeringId) { this.offeringId = offeringId; }
    public OfferingVerificationType getVerificationType() { return verificationType; }
    public void setVerificationType(OfferingVerificationType verificationType) { this.verificationType = verificationType; }
    public OfferingEvidenceStatus getStatus() { return status; }
    public void setStatus(OfferingEvidenceStatus status) { this.status = status; }
    public UUID getEvidenceDocumentId() { return evidenceDocumentId; }
    public void setEvidenceDocumentId(UUID evidenceDocumentId) { this.evidenceDocumentId = evidenceDocumentId; }
    public UUID getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(UUID verifiedBy) { this.verifiedBy = verifiedBy; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

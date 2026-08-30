package com.kemkendra.product;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "supplier_offerings", uniqueConstraints = {
        @UniqueConstraint(name = "uk_supplier_master_product_offering", columnNames = {"master_product_id", "supplier_id"})
})
public class SupplierOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_product_id", nullable = false)
    private MasterProduct masterProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Column(nullable = false)
    private Integer stock = 0;

    @Column(precision = 5, scale = 2)
    private BigDecimal purity;

    @Column(length = 100)
    private String grade;

    @Column(name = "moq_kg", precision = 12, scale = 2)
    private BigDecimal moqKg;

    @Column(length = 150)
    private String packaging;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "coa_available")
    private Boolean coaAvailable = false;

    @Column(name = "msds_available")
    private Boolean msdsAvailable = false;

    @Column(name = "export_ready")
    private Boolean exportReady = false;

    @Column(name = "availability_status", length = 50)
    private String availabilityStatus = "AVAILABLE";

    @Column(name = "moderation_status", length = 50)
    private String moderationStatus = "PENDING_REVIEW";

    @Column(name = "moderation_notes", columnDefinition = "TEXT")
    private String moderationNotes;

    @Column(name = "offering_verification_status", length = 50)
    private String offeringVerificationStatus = "UNVERIFIED";

    @Column(name = "completeness_score")
    private Integer completenessScore = 0;

    @Column(name = "admin_request_info_notes", columnDefinition = "TEXT")
    private String adminRequestInfoNotes;

    @Column(name = "supplier_response_notes", columnDefinition = "TEXT")
    private String supplierResponseNotes;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verified_by")
    private UUID verifiedBy;

    @Column(name = "created_by_role", length = 50)
    private String createdByRole = "SUPPLIER";

    @Column(name = "created_by_admin_id")
    private UUID createdByAdminId;

    @Column(name = "created_by_admin_name")
    private String createdByAdminName;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public SupplierOffering() {
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public MasterProduct getMasterProduct() { return masterProduct; }
    public void setMasterProduct(MasterProduct masterProduct) { this.masterProduct = masterProduct; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public BigDecimal getPurity() { return purity; }
    public void setPurity(BigDecimal purity) { this.purity = purity; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public BigDecimal getMoqKg() { return moqKg; }
    public void setMoqKg(BigDecimal moqKg) { this.moqKg = moqKg; }
    public String getPackaging() { return packaging; }
    public void setPackaging(String packaging) { this.packaging = packaging; }
    public Integer getLeadTimeDays() { return leadTimeDays; }
    public void setLeadTimeDays(Integer leadTimeDays) { this.leadTimeDays = leadTimeDays; }
    public Boolean getCoaAvailable() { return coaAvailable; }
    public void setCoaAvailable(Boolean coaAvailable) { this.coaAvailable = coaAvailable; }
    public Boolean getMsdsAvailable() { return msdsAvailable; }
    public void setMsdsAvailable(Boolean msdsAvailable) { this.msdsAvailable = msdsAvailable; }
    public Boolean getExportReady() { return exportReady; }
    public void setExportReady(Boolean exportReady) { this.exportReady = exportReady; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }
    public String getModerationStatus() { return moderationStatus; }
    public void setModerationStatus(String moderationStatus) { this.moderationStatus = moderationStatus; }
    public String getModerationNotes() { return moderationNotes; }
    public void setModerationNotes(String moderationNotes) { this.moderationNotes = moderationNotes; }

    public String getOfferingVerificationStatus() { return offeringVerificationStatus; }
    public void setOfferingVerificationStatus(String offeringVerificationStatus) { this.offeringVerificationStatus = offeringVerificationStatus; }
    public Integer getCompletenessScore() { return completenessScore; }
    public void setCompletenessScore(Integer completenessScore) { this.completenessScore = completenessScore; }
    public String getAdminRequestInfoNotes() { return adminRequestInfoNotes; }
    public void setAdminRequestInfoNotes(String adminRequestInfoNotes) { this.adminRequestInfoNotes = adminRequestInfoNotes; }
    public String getSupplierResponseNotes() { return supplierResponseNotes; }
    public void setSupplierResponseNotes(String supplierResponseNotes) { this.supplierResponseNotes = supplierResponseNotes; }
    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
    public UUID getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(UUID verifiedBy) { this.verifiedBy = verifiedBy; }

    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }
    public UUID getCreatedByAdminId() { return createdByAdminId; }
    public void setCreatedByAdminId(UUID createdByAdminId) { this.createdByAdminId = createdByAdminId; }
    public String getCreatedByAdminName() { return createdByAdminName; }
    public void setCreatedByAdminName(String createdByAdminName) { this.createdByAdminName = createdByAdminName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

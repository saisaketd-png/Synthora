package com.synthora.rfq.quotation;

import com.synthora.rfq.Rfq;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "quotations", uniqueConstraints = {
        @UniqueConstraint(name = "uk_rfq_version", columnNames = {"rfq_id", "quotation_version"})
})
public class Quotation {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rfq_id", nullable = false)
    private Rfq rfq;

    @Column(name = "quotation_version", nullable = false)
    private Integer quotationVersion;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 4)
    private BigDecimal unitPrice;

    @Column(nullable = false, length = 10)
    private String currency;

    @Column(name = "minimum_order_quantity", precision = 18, scale = 4)
    private BigDecimal minimumOrderQuantity;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "validity_date", nullable = false)
    private LocalDate validityDate;

    @Column(name = "packaging_details", columnDefinition = "TEXT")
    private String packagingDetails;

    @Column(name = "commercial_notes", columnDefinition = "TEXT")
    private String commercialNotes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Rfq getRfq() {
        return rfq;
    }

    public void setRfq(Rfq rfq) {
        this.rfq = rfq;
    }

    public Integer getQuotationVersion() {
        return quotationVersion;
    }

    public void setQuotationVersion(Integer quotationVersion) {
        this.quotationVersion = quotationVersion;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public BigDecimal getMinimumOrderQuantity() {
        return minimumOrderQuantity;
    }

    public void setMinimumOrderQuantity(BigDecimal minimumOrderQuantity) {
        this.minimumOrderQuantity = minimumOrderQuantity;
    }

    public Integer getLeadTimeDays() {
        return leadTimeDays;
    }

    public void setLeadTimeDays(Integer leadTimeDays) {
        this.leadTimeDays = leadTimeDays;
    }

    public LocalDate getValidityDate() {
        return validityDate;
    }

    public void setValidityDate(LocalDate validityDate) {
        this.validityDate = validityDate;
    }

    public String getPackagingDetails() {
        return packagingDetails;
    }

    public void setPackagingDetails(String packagingDetails) {
        this.packagingDetails = packagingDetails;
    }

    public String getCommercialNotes() {
        return commercialNotes;
    }

    public void setCommercialNotes(String commercialNotes) {
        this.commercialNotes = commercialNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

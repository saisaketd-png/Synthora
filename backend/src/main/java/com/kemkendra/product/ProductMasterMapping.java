package com.kemkendra.product;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "product_master_mappings")
public class ProductMasterMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "legacy_product_id", nullable = false, unique = true)
    private Product legacyProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_product_id", nullable = false)
    private MasterProduct masterProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_offering_id")
    private SupplierOffering supplierOffering;

    @Column(name = "mapping_status", nullable = false, length = 50)
    private String mappingStatus = "AUTO_MIGRATED";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ProductMasterMapping() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Product getLegacyProduct() {
        return legacyProduct;
    }

    public void setLegacyProduct(Product legacyProduct) {
        this.legacyProduct = legacyProduct;
    }

    public MasterProduct getMasterProduct() {
        return masterProduct;
    }

    public void setMasterProduct(MasterProduct masterProduct) {
        this.masterProduct = masterProduct;
    }

    public SupplierOffering getSupplierOffering() {
        return supplierOffering;
    }

    public void setSupplierOffering(SupplierOffering supplierOffering) {
        this.supplierOffering = supplierOffering;
    }

    public String getMappingStatus() {
        return mappingStatus;
    }

    public void setMappingStatus(String mappingStatus) {
        this.mappingStatus = mappingStatus;
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

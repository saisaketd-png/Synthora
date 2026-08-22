package com.synthora.product;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "master_products")
public class MasterProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "master_product_code", nullable = false, unique = true, length = 50)
    private String masterProductCode;

    @Column(nullable = false)
    private String name;

    @Column(name = "cas_number", length = 100)
    private String casNumber;

    @Column(name = "molecular_formula", length = 100)
    private String molecularFormula;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 100)
    private ProductCategory category;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "merged_into_master_product_id")
    private MasterProduct mergedIntoMasterProduct;

    @Column(name = "deactivated_at")
    private LocalDateTime deactivatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deactivated_by")
    private com.synthora.identity.User deactivatedBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "masterProduct", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SupplierOffering> offerings = new ArrayList<>();

    @OneToMany(mappedBy = "masterProduct", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductSynonym> synonyms = new ArrayList<>();

    public MasterProduct() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getMasterProductCode() {
        return masterProductCode;
    }

    public void setMasterProductCode(String masterProductCode) {
        this.masterProductCode = masterProductCode;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public MasterProduct getMergedIntoMasterProduct() {
        return mergedIntoMasterProduct;
    }

    public void setMergedIntoMasterProduct(MasterProduct mergedIntoMasterProduct) {
        this.mergedIntoMasterProduct = mergedIntoMasterProduct;
    }

    public LocalDateTime getDeactivatedAt() {
        return deactivatedAt;
    }

    public void setDeactivatedAt(LocalDateTime deactivatedAt) {
        this.deactivatedAt = deactivatedAt;
    }

    public com.synthora.identity.User getDeactivatedBy() {
        return deactivatedBy;
    }

    public void setDeactivatedBy(com.synthora.identity.User deactivatedBy) {
        this.deactivatedBy = deactivatedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<SupplierOffering> getOfferings() {
        return offerings;
    }

    public void setOfferings(List<SupplierOffering> offerings) {
        this.offerings = offerings;
    }

    public List<ProductSynonym> getSynonyms() {
        return synonyms;
    }

    public void setSynonyms(List<ProductSynonym> synonyms) {
        this.synonyms = synonyms;
    }
}

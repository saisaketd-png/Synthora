package com.synthora.product;

import com.synthora.identity.User;
import jakarta.persistence.*;

import com.synthora.product.ProductCategory;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "product_code", unique = true, length = 50)
    private String productCode;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductCategory category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private java.util.List<ProductImage> images = new java.util.ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(name = "cas_number", length = 100)
    private String casNumber;

    @Column(name = "molecular_formula", length = 100)
    private String molecularFormula;

    @Column(name = "purity", precision = 5, scale = 2)
    private BigDecimal purity;

    @Column(name = "grade", length = 100)
    private String grade;

    @Column(name = "packaging", length = 150)
    private String packaging;

    @Column(name = "moq_kg", precision = 12, scale = 2)
    private BigDecimal moqKg;

    @Column(name = "lead_time_days")
    private Integer leadTimeDays;

    @Column(name = "coa_available")
    private Boolean coaAvailable = false;

    @Column(name = "msds_available")
    private Boolean msdsAvailable = false;

    @Column(name = "export_ready")
    private Boolean exportReady = false;

    @Column(name = "availability_status", length = 50)
    private String availabilityStatus;

    public Product() {
    }


    // ---------- Getters ----------


    public ProductCategory getCategory() {
        return category;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public Integer getStock() {
        return stock;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public User getSeller() {
        return seller;
    }

    // ---------- Setters ----------

    public void setName(String name) {
        this.name = name;
    }

    public void setCategory(ProductCategory category) {
        this.category = category;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setSeller(User seller) {
        this.seller = seller;
    }

    public String getCasNumber() { return casNumber; }
    public void setCasNumber(String casNumber) { this.casNumber = casNumber; }

    public String getMolecularFormula() { return molecularFormula; }
    public void setMolecularFormula(String molecularFormula) { this.molecularFormula = molecularFormula; }

    public BigDecimal getPurity() { return purity; }
    public void setPurity(BigDecimal purity) { this.purity = purity; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getPackaging() { return packaging; }
    public void setPackaging(String packaging) { this.packaging = packaging; }

    public BigDecimal getMoqKg() { return moqKg; }
    public void setMoqKg(BigDecimal moqKg) { this.moqKg = moqKg; }

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

    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }

    public java.util.List<ProductImage> getImages() { return images; }
    public void setImages(java.util.List<ProductImage> images) { this.images = images; }

    @PrePersist
    protected void onCreate() {
        if (productCode == null || productCode.isBlank()) {
            String prefix = category != null ? category.name() : "SYN";
            if (prefix.length() > 3) prefix = prefix.substring(0, 3);
            productCode = prefix + "-" + (100000 + (int)(Math.random() * 900000));
        }
    }
}
package com.synthora.product;

import com.synthora.identity.User;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "master_product_synonyms")
public class ProductSynonym {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_product_id", nullable = false)
    private MasterProduct masterProduct;

    @Column(nullable = false)
    private String synonym;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SynonymSource source = SynonymSource.OFFICIAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private SynonymStatus status = SynonymStatus.APPROVED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public ProductSynonym() {
    }

    public ProductSynonym(MasterProduct masterProduct, String synonym, SynonymSource source, User createdBy) {
        this.masterProduct = masterProduct;
        this.synonym = synonym;
        this.source = source != null ? source : SynonymSource.OFFICIAL;
        this.status = SynonymStatus.APPROVED;
        this.createdBy = createdBy;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public MasterProduct getMasterProduct() {
        return masterProduct;
    }

    public void setMasterProduct(MasterProduct masterProduct) {
        this.masterProduct = masterProduct;
    }

    public String getSynonym() {
        return synonym;
    }

    public void setSynonym(String synonym) {
        this.synonym = synonym;
    }

    public SynonymSource getSource() {
        return source;
    }

    public void setSource(SynonymSource source) {
        this.source = source;
    }

    public SynonymStatus getStatus() {
        return status;
    }

    public void setStatus(SynonymStatus status) {
        this.status = status;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

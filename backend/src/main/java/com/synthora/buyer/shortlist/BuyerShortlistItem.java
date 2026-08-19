package com.synthora.buyer.shortlist;

import com.synthora.product.MasterProduct;
import com.synthora.product.SupplierOffering;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "buyer_shortlist_items", uniqueConstraints = {
        @UniqueConstraint(name = "uq_shortlist_offering", columnNames = {"shortlist_id", "supplier_offering_id"})
})
public class BuyerShortlistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shortlist_id", nullable = false)
    private BuyerShortlist shortlist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_product_id", nullable = false)
    private MasterProduct masterProduct;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_offering_id", nullable = false)
    private SupplierOffering supplierOffering;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public BuyerShortlistItem() {
    }

    public BuyerShortlistItem(BuyerShortlist shortlist, MasterProduct masterProduct, SupplierOffering supplierOffering) {
        this.shortlist = shortlist;
        this.masterProduct = masterProduct;
        this.supplierOffering = supplierOffering;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public BuyerShortlist getShortlist() { return shortlist; }
    public void setShortlist(BuyerShortlist shortlist) { this.shortlist = shortlist; }
    public MasterProduct getMasterProduct() { return masterProduct; }
    public void setMasterProduct(MasterProduct masterProduct) { this.masterProduct = masterProduct; }
    public SupplierOffering getSupplierOffering() { return supplierOffering; }
    public void setSupplierOffering(SupplierOffering supplierOffering) { this.supplierOffering = supplierOffering; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

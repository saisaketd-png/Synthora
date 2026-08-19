package com.synthora.buyer.shortlist;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "buyer_shortlists", uniqueConstraints = {
        @UniqueConstraint(name = "uq_buyer_shortlist", columnNames = {"buyer_id"})
})
public class BuyerShortlist {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "buyer_id", nullable = false, unique = true)
    private UUID buyerId;

    @OneToMany(mappedBy = "shortlist", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BuyerShortlistItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public BuyerShortlist() {
    }

    public BuyerShortlist(UUID buyerId) {
        this.buyerId = buyerId;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getBuyerId() { return buyerId; }
    public void setBuyerId(UUID buyerId) { this.buyerId = buyerId; }
    public List<BuyerShortlistItem> getItems() { return items; }
    public void setItems(List<BuyerShortlistItem> items) { this.items = items; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

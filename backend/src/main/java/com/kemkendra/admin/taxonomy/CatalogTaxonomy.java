package com.kemkendra.admin.taxonomy;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "catalog_taxonomies", uniqueConstraints = {
        @UniqueConstraint(name = "uk_catalog_taxonomies_type_code", columnNames = {"taxonomy_type", "code"})
})
public class CatalogTaxonomy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "taxonomy_type", nullable = false, length = 64)
    private String type; // CATEGORY, GRADE, PACKAGING, UNIT, CERTIFICATION, APPLICATION

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public CatalogTaxonomy() {}

    public CatalogTaxonomy(String type, String name, String code, String description, boolean active, int displayOrder) {
        this.type = type;
        this.name = name;
        this.code = code;
        this.description = description;
        this.active = active;
        this.displayOrder = displayOrder;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

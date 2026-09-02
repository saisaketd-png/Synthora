package com.kemkendra.admin.config;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_feature_flags")
public class PlatformFeatureFlag {

    @Id
    @Column(name = "feature_key", nullable = false, length = 100)
    private String key;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "impact_warning", columnDefinition = "TEXT")
    private String impactWarning;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(name = "requires_confirmation", nullable = false)
    private boolean requiresConfirmation = false;

    @Column(name = "is_dangerous", nullable = false)
    private boolean dangerous = false;

    @Column(name = "updated_by", length = 150)
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PlatformFeatureFlag() {}

    public PlatformFeatureFlag(String key, String name, String description, String impactWarning, boolean enabled, boolean requiresConfirmation, boolean dangerous, String updatedBy) {
        this.key = key;
        this.name = name;
        this.description = description;
        this.impactWarning = impactWarning;
        this.enabled = enabled;
        this.requiresConfirmation = requiresConfirmation;
        this.dangerous = dangerous;
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImpactWarning() { return impactWarning; }
    public void setImpactWarning(String impactWarning) { this.impactWarning = impactWarning; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public boolean isRequiresConfirmation() { return requiresConfirmation; }
    public void setRequiresConfirmation(boolean requiresConfirmation) { this.requiresConfirmation = requiresConfirmation; }

    public boolean isDangerous() { return dangerous; }
    public void setDangerous(boolean dangerous) { this.dangerous = dangerous; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

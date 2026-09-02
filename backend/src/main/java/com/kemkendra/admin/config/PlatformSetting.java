package com.kemkendra.admin.config;

import jakarta.persistence.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "platform_settings")
public class PlatformSetting {

    @Id
    @Column(name = "setting_key", nullable = false, length = 100)
    private String key;

    @Column(name = "setting_value", nullable = false, columnDefinition = "TEXT")
    private String value;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "data_type", nullable = false, length = 20)
    private String dataType = "STRING";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "impact_warning", columnDefinition = "TEXT")
    private String impactWarning;

    @Column(name = "updated_by", length = 150)
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public PlatformSetting() {}

    public PlatformSetting(String key, String value, String category, String dataType, String description, String impactWarning, String updatedBy) {
        this.key = key;
        this.value = value;
        this.category = category;
        this.dataType = dataType;
        this.description = description;
        this.impactWarning = impactWarning;
        this.updatedBy = updatedBy;
        this.updatedAt = LocalDateTime.now();
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImpactWarning() { return impactWarning; }
    public void setImpactWarning(String impactWarning) { this.impactWarning = impactWarning; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}

package com.synthora.product;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String slug;

    @Column(name = "country_code")
    private String countryCode;

    @Column(name = "country_name")
    private String countryName;

    @Column(name = "logo_url")
    private String logoUrl;

    private Boolean verified;

    @Column(name = "years_in_business")
    private Integer yearsInBusiness;

    @Column(name = "response_rate")
    private Integer responseRate;

    @Column(name = "export_ready")
    private Boolean exportReady;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getSlug() { return slug; }
    public String getCountryCode() { return countryCode; }
    public String getCountryName() { return countryName; }
    public String getLogoUrl() { return logoUrl; }
    public Boolean getVerified() { return verified; }
    public Integer getYearsInBusiness() { return yearsInBusiness; }
    public Integer getResponseRate() { return responseRate; }
    public Boolean getExportReady() { return exportReady; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
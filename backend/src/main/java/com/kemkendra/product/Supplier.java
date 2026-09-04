package com.kemkendra.product;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.kemkendra.identity.User;
import com.kemkendra.seller.SupplierVerificationStatus;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String name;

    private String slug;

    @Column(name = "legal_name")
    private String legalName;

    @Column(name = "trade_name")
    private String tradeName;

    @Column(name = "business_type")
    private String businessType = "MANUFACTURER";

    @Column(name = "registered_address", columnDefinition = "TEXT")
    private String registeredAddress;

    @Column(name = "state_province")
    private String stateProvince;

    private String city;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(name = "business_email")
    private String businessEmail;

    @Column(name = "business_phone")
    private String businessPhone;

    @Column(name = "authorized_representative_name")
    private String authorizedRepresentativeName;

    @Column(name = "authorized_representative_designation")
    private String authorizedRepresentativeDesignation;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Column(name = "phone_verified")
    private Boolean phoneVerified = false;

    private String website;

    @Column(name = "tax_vat_number")
    private String taxVatNumber;

    @Column(name = "company_registration_number")
    private String companyRegistrationNumber;

    @Column(name = "business_description", columnDefinition = "TEXT")
    private String businessDescription;

    @Column(name = "countries_served", columnDefinition = "TEXT")
    private String countriesServed;

    @Column(name = "primary_categories", columnDefinition = "TEXT")
    private String primaryCategories;

    @Column(name = "admin_request_info_notes", columnDefinition = "TEXT")
    private String adminRequestInfoNotes;

    @Column(name = "supplier_response_notes", columnDefinition = "TEXT")
    private String supplierResponseNotes;

    @Column(name = "country_code")
    private String countryCode;

    @Column(name = "country_name")
    private String countryName;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "logo_storage_path")
    private String logoStoragePath;

    @Column(name = "logo_content_type")
    private String logoContentType;

    private Boolean verified;

    @Column(name = "years_in_business")
    private Integer yearsInBusiness;

    @Column(name = "response_rate")
    private Integer responseRate;

    @Column(name = "export_ready")
    private Boolean exportReady;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private SupplierVerificationStatus verificationStatus = SupplierVerificationStatus.DRAFT;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    @Column(name = "verification_updated_at")
    private LocalDateTime verificationUpdatedAt;

    public SupplierVerificationStatus getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(SupplierVerificationStatus verificationStatus) { this.verificationStatus = verificationStatus; }
    public String getVerificationNotes() { return verificationNotes; }
    public void setVerificationNotes(String verificationNotes) { this.verificationNotes = verificationNotes; }
    public LocalDateTime getVerificationUpdatedAt() { return verificationUpdatedAt; }
    public void setVerificationUpdatedAt(LocalDateTime verificationUpdatedAt) { this.verificationUpdatedAt = verificationUpdatedAt; }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getLegalName() { return legalName; }
    public void setLegalName(String legalName) { this.legalName = legalName; }
    public String getTradeName() { return tradeName; }
    public void setTradeName(String tradeName) { this.tradeName = tradeName; }
    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }
    @PrePersist
    @PreUpdate
    protected void syncUserEmail() {
        if (user != null && user.getEmail() != null) {
            this.businessEmail = user.getEmail();
        }
    }

    public String getRegisteredAddress() { return registeredAddress; }
    public void setRegisteredAddress(String registeredAddress) { this.registeredAddress = registeredAddress; }
    public String getStateProvince() { return stateProvince; }
    public void setStateProvince(String stateProvince) { this.stateProvince = stateProvince; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public String getBusinessEmail() {
        if (user != null && user.getEmail() != null) {
            return user.getEmail();
        }
        return businessEmail;
    }
    public void setBusinessEmail(String businessEmail) {
        if (user != null && user.getEmail() != null) {
            this.businessEmail = user.getEmail();
        } else {
            this.businessEmail = businessEmail;
        }
    }
    public String getBusinessPhone() { return businessPhone; }
    public void setBusinessPhone(String businessPhone) { this.businessPhone = businessPhone; }
    public String getAuthorizedRepresentativeName() { return authorizedRepresentativeName; }
    public void setAuthorizedRepresentativeName(String authorizedRepresentativeName) { this.authorizedRepresentativeName = authorizedRepresentativeName; }
    public String getAuthorizedRepresentativeDesignation() { return authorizedRepresentativeDesignation; }
    public void setAuthorizedRepresentativeDesignation(String authorizedRepresentativeDesignation) { this.authorizedRepresentativeDesignation = authorizedRepresentativeDesignation; }
    public Boolean getEmailVerified() { return emailVerified != null && emailVerified; }
    public void setEmailVerified(Boolean emailVerified) { this.emailVerified = emailVerified; }
    public Boolean getPhoneVerified() { return phoneVerified != null && phoneVerified; }
    public void setPhoneVerified(Boolean phoneVerified) { this.phoneVerified = phoneVerified; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public String getTaxVatNumber() { return taxVatNumber; }
    public void setTaxVatNumber(String taxVatNumber) { this.taxVatNumber = taxVatNumber; }
    public String getCompanyRegistrationNumber() { return companyRegistrationNumber; }
    public void setCompanyRegistrationNumber(String companyRegistrationNumber) { this.companyRegistrationNumber = companyRegistrationNumber; }
    public String getBusinessDescription() { return businessDescription; }
    public void setBusinessDescription(String businessDescription) { this.businessDescription = businessDescription; }
    public String getCountriesServed() { return countriesServed; }
    public void setCountriesServed(String countriesServed) { this.countriesServed = countriesServed; }
    public String getPrimaryCategories() { return primaryCategories; }
    public void setPrimaryCategories(String primaryCategories) { this.primaryCategories = primaryCategories; }
    public String getAdminRequestInfoNotes() { return adminRequestInfoNotes; }
    public void setAdminRequestInfoNotes(String adminRequestInfoNotes) { this.adminRequestInfoNotes = adminRequestInfoNotes; }
    public String getSupplierResponseNotes() { return supplierResponseNotes; }
    public void setSupplierResponseNotes(String supplierResponseNotes) { this.supplierResponseNotes = supplierResponseNotes; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getCountryName() { return countryName; }
    public void setCountryName(String countryName) { this.countryName = countryName; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    public String getLogoStoragePath() { return logoStoragePath; }
    public void setLogoStoragePath(String logoStoragePath) { this.logoStoragePath = logoStoragePath; }
    public String getLogoContentType() { return logoContentType; }
    public void setLogoContentType(String logoContentType) { this.logoContentType = logoContentType; }
    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }
    public Integer getYearsInBusiness() { return yearsInBusiness; }
    public void setYearsInBusiness(Integer yearsInBusiness) { this.yearsInBusiness = yearsInBusiness; }
    public Integer getResponseRate() { return responseRate; }
    public void setResponseRate(Integer responseRate) { this.responseRate = responseRate; }
    public Boolean getExportReady() { return exportReady; }
    public void setExportReady(Boolean exportReady) { this.exportReady = exportReady; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
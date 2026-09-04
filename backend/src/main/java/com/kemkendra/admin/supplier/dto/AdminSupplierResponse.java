package com.kemkendra.admin.supplier.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.kemkendra.identity.UserStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminSupplierResponse(
        Long id,
        String name,
        String slug,
        String countryCode,
        String countryName,
        String logoUrl,
        Boolean verified,
        Integer yearsInBusiness,
        Integer responseRate,
        Boolean exportReady,
        UUID userId,
        String userEmail,
        UserStatus userStatus,
        LocalDateTime createdAt,
        String verificationStatus,
        String city,
        String businessType
) {
    public AdminSupplierResponse(
            Long id,
            String name,
            String slug,
            String countryCode,
            String countryName,
            String logoUrl,
            Boolean verified,
            Integer yearsInBusiness,
            Integer responseRate,
            Boolean exportReady,
            UUID userId,
            String userEmail,
            UserStatus userStatus,
            LocalDateTime createdAt
    ) {
        this(id, name, slug, countryCode, countryName, logoUrl, verified, yearsInBusiness, responseRate, exportReady, userId, userEmail, userStatus, createdAt, verified != null && verified ? "VERIFIED" : "PENDING", null, "MANUFACTURER");
    }

    @JsonProperty("companyName")
    public String companyName() {
        return name;
    }
}

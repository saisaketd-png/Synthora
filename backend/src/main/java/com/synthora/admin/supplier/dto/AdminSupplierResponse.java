package com.synthora.admin.supplier.dto;

import com.synthora.identity.UserStatus;

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
        LocalDateTime createdAt
) {
}

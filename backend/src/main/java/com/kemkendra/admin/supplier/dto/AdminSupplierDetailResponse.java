package com.kemkendra.admin.supplier.dto;

import com.kemkendra.identity.UserStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record AdminSupplierDetailResponse(
        Long id,
        String name,
        String slug,
        String legalName,
        String businessType,
        String countryCode,
        String countryName,
        String logoUrl,
        Boolean verified,
        String verificationStatus,
        Integer yearsInBusiness,
        Integer responseRate,
        Boolean exportReady,
        LocalDateTime createdAt,
        UUID userId,
        String userEmail,
        UserStatus userStatus,
        long offeringCount,
        long activeOfferingCount,
        long rfqReceivedCount,
        long poFulfilledCount,
        AdminSellerProfileInfo sellerProfile
) {
}

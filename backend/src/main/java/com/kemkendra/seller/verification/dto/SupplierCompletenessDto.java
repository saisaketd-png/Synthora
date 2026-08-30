package com.kemkendra.seller.verification.dto;

public record SupplierCompletenessDto(
        int overallPercentage,
        boolean companyIdentity,
        boolean businessInformation,
        boolean contactInformation,
        boolean taxInformation,
        boolean businessDocuments,
        boolean complianceDocuments,
        boolean catalogInformation
) {}

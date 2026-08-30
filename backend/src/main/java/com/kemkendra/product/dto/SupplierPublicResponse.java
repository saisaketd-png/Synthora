package com.kemkendra.product.dto;

public record SupplierPublicResponse(
        Long id,
        String name,
        String slug,
        String countryCode,
        String countryName,
        String logoUrl,
        Boolean verified,
        Integer yearsInBusiness,
        Integer responseRate,
        Long averageResponseTimeSeconds,
        String formattedResponseTime,
        Long eligibleRfqs,
        Long respondedRfqs,
        Boolean exportReady,
        String aboutCompany,
        String website,
        String certifications
) {
}

package com.synthora.product.dto;

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
        Boolean exportReady,
        String aboutCompany,
        String website,
        String certifications
) {
}

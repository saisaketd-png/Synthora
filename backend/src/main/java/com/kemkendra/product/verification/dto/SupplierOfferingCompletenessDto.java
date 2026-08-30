package com.kemkendra.product.verification.dto;

public record SupplierOfferingCompletenessDto(
        int overallPercentage,
        boolean commercialTerms,
        boolean purityAndGrade,
        boolean moqAndPackaging,
        boolean leadTimeAndAvailability,
        boolean coa,
        boolean msds,
        boolean exportInformation,
        boolean imagesOrTechnicalData
) {}

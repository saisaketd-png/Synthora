package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

import java.math.BigDecimal;

public record MasterProductSearchCriteria(
        String query,
        ProductCategory category,
        BigDecimal minPurity,
        BigDecimal maxPurity,
        String grade,
        String currency,
        BigDecimal maxPrice,
        BigDecimal minMoq,
        BigDecimal maxMoq,
        Integer maxLeadTime,
        String availabilityStatus,
        Integer minStock,
        Boolean coaAvailable,
        Boolean msdsAvailable,
        Boolean exportReady,
        Boolean verifiedSupplier,
        Boolean requireActiveOfferings,
        Integer page,
        Integer size,
        String sort
) {
    public MasterProductSearchCriteria {
        if (page == null || page < 0) page = 0;
        if (size == null || size < 1) size = 20;
        if (size > 100) size = 100;
        if (currency == null || currency.isBlank()) currency = "INR";
        if (requireActiveOfferings == null) requireActiveOfferings = true;
    }

    public boolean hasOfferingFilters() {
        return (minPurity != null)
                || (maxPurity != null)
                || (grade != null && !grade.isBlank())
                || (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0)
                || (minMoq != null)
                || (maxMoq != null)
                || (maxLeadTime != null)
                || (minStock != null && minStock > 0)
                || Boolean.TRUE.equals(coaAvailable)
                || Boolean.TRUE.equals(msdsAvailable)
                || Boolean.TRUE.equals(exportReady)
                || Boolean.TRUE.equals(verifiedSupplier)
                || (availabilityStatus != null && !availabilityStatus.isBlank());
    }

    // Constructor with grade but without requireActiveOfferings
    public MasterProductSearchCriteria(
            String query,
            ProductCategory category,
            BigDecimal minPurity,
            BigDecimal maxPurity,
            String grade,
            String currency,
            BigDecimal maxPrice,
            BigDecimal minMoq,
            BigDecimal maxMoq,
            Integer maxLeadTime,
            String availabilityStatus,
            Integer minStock,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            Boolean verifiedSupplier,
            Integer page,
            Integer size,
            String sort
    ) {
        this(query, category, minPurity, maxPurity, grade, currency, maxPrice, minMoq, maxMoq,
                maxLeadTime, availabilityStatus, minStock, coaAvailable, msdsAvailable,
                exportReady, verifiedSupplier, true, page, size, sort);
    }

    // Backward-compatible constructor without grade
    public MasterProductSearchCriteria(
            String query,
            ProductCategory category,
            BigDecimal minPurity,
            BigDecimal maxPurity,
            String currency,
            BigDecimal maxPrice,
            BigDecimal minMoq,
            BigDecimal maxMoq,
            Integer maxLeadTime,
            String availabilityStatus,
            Integer minStock,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            Boolean verifiedSupplier,
            Boolean requireActiveOfferings,
            Integer page,
            Integer size,
            String sort
    ) {
        this(query, category, minPurity, maxPurity, null, currency, maxPrice, minMoq, maxMoq,
                maxLeadTime, availabilityStatus, minStock, coaAvailable, msdsAvailable,
                exportReady, verifiedSupplier, requireActiveOfferings, page, size, sort);
    }

    // Backward-compatible constructor without grade and without requireActiveOfferings
    public MasterProductSearchCriteria(
            String query,
            ProductCategory category,
            BigDecimal minPurity,
            BigDecimal maxPurity,
            String currency,
            BigDecimal maxPrice,
            BigDecimal minMoq,
            BigDecimal maxMoq,
            Integer maxLeadTime,
            String availabilityStatus,
            Integer minStock,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            Boolean verifiedSupplier,
            Integer page,
            Integer size,
            String sort
    ) {
        this(query, category, minPurity, maxPurity, null, currency, maxPrice, minMoq, maxMoq,
                maxLeadTime, availabilityStatus, minStock, coaAvailable, msdsAvailable,
                exportReady, verifiedSupplier, true, page, size, sort);
    }
}

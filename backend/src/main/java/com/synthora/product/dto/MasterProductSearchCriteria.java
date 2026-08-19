package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

import java.math.BigDecimal;

public record MasterProductSearchCriteria(
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
    public MasterProductSearchCriteria {
        if (page == null || page < 0) page = 0;
        if (size == null || size < 1) size = 20;
        if (size > 100) size = 100;
        if (currency == null || currency.isBlank()) currency = "INR";
    }
}

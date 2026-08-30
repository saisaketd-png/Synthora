package com.kemkendra.product.dto;

import com.kemkendra.product.ProductCategory;

import java.math.BigDecimal;
import java.util.UUID;

public record SupplierProductPublicResponse(
        UUID id,
        String name,
        String description,
        ProductCategory category,
        String casNumber,
        String molecularFormula,
        BigDecimal purity,
        String grade,
        BigDecimal moqKg,
        String packaging,
        Integer leadTimeDays,
        String availabilityStatus,
        Boolean exportReady
) {}

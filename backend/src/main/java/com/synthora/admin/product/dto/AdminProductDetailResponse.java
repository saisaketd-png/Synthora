package com.synthora.admin.product.dto;

import com.synthora.product.ProductCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminProductDetailResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        ProductCategory category,
        String casNumber,
        String molecularFormula,
        BigDecimal purity,
        String grade,
        String packaging,
        BigDecimal moqKg,
        Integer leadTimeDays,
        Boolean coaAvailable,
        Boolean msdsAvailable,
        Boolean exportReady,
        String availabilityStatus,
        UUID sellerId,
        String sellerName,
        String sellerEmail,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        int supplierOfferingCount
) {
}

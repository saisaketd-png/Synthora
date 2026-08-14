package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String description,

        // Commercial fields
        BigDecimal price,
        Integer stock,
        ProductCategory category,

        // Enterprise technical fields
        String casNumber,
        String molecularFormula,
        BigDecimal purity,
        String grade,
        String packaging,
        BigDecimal moqKg,
        Integer leadTimeDays,

        // Documentation & export
        Boolean coaAvailable,
        Boolean msdsAvailable,
        Boolean exportReady,
        String availabilityStatus,

        // Audit fields
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // Supplier info
        UUID sellerId,
        String sellerName
) {
}
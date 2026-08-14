package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductDetailResponse(
        UUID id,
        String name,
        String description,
        ProductCategory category,

        // Technical
        String casNumber,
        String molecularFormula,
        BigDecimal purity,
        String grade,

        // Commercial
        BigDecimal price,
        Integer stock,
        BigDecimal moqKg,
        String packaging,
        Integer leadTimeDays,
        String availabilityStatus,

        // Documentation
        Boolean coaAvailable,
        Boolean msdsAvailable,
        Boolean exportReady,

        // Supplier
        UUID sellerId,
        String sellerName,

        // Audit
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
package com.kemkendra.product.dto;

import com.kemkendra.product.ProductCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import java.util.List;

public record ProductDetailResponse(
        UUID id,
        String productCode,
        String name,
        String description,
        ProductCategory category,
        String primaryImageUrl,
        List<ProductImageResponse> images,

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
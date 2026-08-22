package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

import java.time.LocalDateTime;
import java.util.UUID;

public record MasterProductResponse(
        UUID id,
        String masterProductCode,
        String name,
        String casNumber,
        String molecularFormula,
        ProductCategory category,
        String description,
        String status,
        int offeringCount,
        String primaryImageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

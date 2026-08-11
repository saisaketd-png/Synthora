package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        ProductCategory category,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        UUID sellerId,
        String sellerName
) {
}
package com.synthora.product.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record CatalogImageResponse(
        UUID id,
        String imageUrl,
        String fileName,
        String contentType,
        Long fileSize,
        Boolean isPrimary,
        Integer displayOrder,
        String altText,
        String status,
        LocalDateTime createdAt
) {
}

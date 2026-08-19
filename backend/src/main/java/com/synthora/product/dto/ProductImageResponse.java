package com.synthora.product.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductImageResponse(
        UUID id,
        UUID productId,
        String fileName,
        String contentType,
        Long fileSize,
        Boolean isPrimary,
        Integer displayOrder,
        String imageUrl,
        LocalDateTime createdAt
) {
}

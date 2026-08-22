package com.synthora.product.dto;

import com.synthora.product.SynonymSource;
import com.synthora.product.SynonymStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductSynonymResponse(
        UUID id,
        UUID masterProductId,
        String synonym,
        SynonymSource source,
        SynonymStatus status,
        UUID createdById,
        String createdByName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

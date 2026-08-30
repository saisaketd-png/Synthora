package com.kemkendra.product.verification.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record OfferingAuditDto(
        UUID id,
        String adminName,
        String action,
        String previousStatus,
        String newStatus,
        String fieldName,
        String previousValue,
        String newValue,
        String reason,
        LocalDateTime timestamp
) {}

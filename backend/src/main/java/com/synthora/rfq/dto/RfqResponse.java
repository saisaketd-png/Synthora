package com.synthora.rfq.dto;

import com.synthora.rfq.RfqStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record RfqResponse(
        UUID id,
        UUID buyerId,
        UUID productId,
        Long supplierId,
        BigDecimal quantity,
        String unit,
        String message,
        RfqStatus status,
        LocalDateTime createdAt
) {
}
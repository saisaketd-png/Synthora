package com.synthora.rfq.dto;

import com.synthora.rfq.RfqStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record RfqResponse(
        UUID id,
        String rfqReference,
        UUID buyerId,
        String buyerName,
        UUID productId,
        String productName,
        Long supplierId,
        String supplierName,
        BigDecimal quantity,
        String unit,
        String message,
        RfqStatus status,
        LocalDateTime createdAt
) {
}
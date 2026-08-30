package com.kemkendra.rfq.dto;

import com.kemkendra.rfq.RfqStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record RfqResponse(
        UUID id,
        String rfqReference,
        UUID sourcingRequestId,
        String sourcingRequestReference,
        UUID buyerId,
        String buyerName,
        UUID productId,
        UUID masterProductId,
        UUID supplierOfferingId,
        String productName,
        Long supplierId,
        String supplierName,
        BigDecimal quantity,
        String unit,
        String message,
        RfqStatus status,
        LocalDateTime expiresAt,
        LocalDateTime createdAt
) {
    public RfqResponse(
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
        this(id, rfqReference, null, null, buyerId, buyerName, productId, null, null, productName, supplierId, supplierName, quantity, unit, message, status, null, createdAt);
    }

    public RfqResponse(
            UUID id,
            String rfqReference,
            UUID buyerId,
            String buyerName,
            UUID productId,
            UUID masterProductId,
            UUID supplierOfferingId,
            String productName,
            Long supplierId,
            String supplierName,
            BigDecimal quantity,
            String unit,
            String message,
            RfqStatus status,
            LocalDateTime createdAt
    ) {
        this(id, rfqReference, null, null, buyerId, buyerName, productId, masterProductId, supplierOfferingId, productName, supplierId, supplierName, quantity, unit, message, status, null, createdAt);
    }
}
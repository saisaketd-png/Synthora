package com.synthora.rfq.dto;

import com.synthora.rfq.sourcing.SourcingRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SourcingRequestResponse(
        UUID id,
        String sourcingRequestReference,
        UUID buyerId,
        String buyerName,
        UUID masterProductId,
        UUID productId,
        String productName,
        BigDecimal targetQuantity,
        String unit,
        SourcingRequestStatus status,
        LocalDateTime expiresAt,
        String notes,
        LocalDateTime createdAt,
        List<RfqResponse> supplierParticipations
) {
}

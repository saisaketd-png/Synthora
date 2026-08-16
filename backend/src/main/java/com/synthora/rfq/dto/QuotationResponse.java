package com.synthora.rfq.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record QuotationResponse(
        UUID id,
        UUID rfqId,
        Integer quotationVersion,
        BigDecimal unitPrice,
        String currency,
        BigDecimal minimumOrderQuantity,
        Integer leadTimeDays,
        LocalDate validityDate,
        String packagingDetails,
        String commercialNotes,
        LocalDateTime createdAt
) {
}

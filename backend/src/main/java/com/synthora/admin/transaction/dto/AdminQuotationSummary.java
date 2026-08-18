package com.synthora.admin.transaction.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminQuotationSummary(
        UUID id,
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

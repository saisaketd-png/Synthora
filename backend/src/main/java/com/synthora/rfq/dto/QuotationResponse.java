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
        String actorType,
        String actionType,
        String commercialMessage,
        LocalDateTime createdAt
) {
    // Overloaded constructor for backward compatibility
    public QuotationResponse(
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
        this(
                id,
                rfqId,
                quotationVersion,
                unitPrice,
                currency,
                minimumOrderQuantity,
                leadTimeDays,
                validityDate,
                packagingDetails,
                commercialNotes,
                "SUPPLIER",
                "INITIAL_QUOTATION",
                null,
                createdAt
        );
    }
}

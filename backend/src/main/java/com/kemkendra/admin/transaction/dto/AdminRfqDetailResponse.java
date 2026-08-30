package com.kemkendra.admin.transaction.dto;

import com.kemkendra.rfq.RfqStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record AdminRfqDetailResponse(
        UUID id,
        UUID buyerId,
        String buyerName,
        String buyerEmail,
        UUID productId,
        String productName,
        Long supplierId,
        String supplierName,
        BigDecimal quantity,
        String unit,
        String message,
        RfqStatus status,
        UUID acceptedQuotationId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<AdminQuotationSummary> quotations
) {
}

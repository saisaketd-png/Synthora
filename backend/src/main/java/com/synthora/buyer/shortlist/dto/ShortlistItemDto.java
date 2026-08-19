package com.synthora.buyer.shortlist.dto;

import com.synthora.product.dto.BestMatchExplanationDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record ShortlistItemDto(
        UUID itemId,
        UUID masterProductId,
        String masterProductName,
        String masterProductCode,
        String casNumber,
        UUID supplierOfferingId,
        Long supplierId,
        String supplierName,
        String supplierVerificationStatus,
        BigDecimal price,
        String currency,
        BigDecimal purity,
        String grade,
        BigDecimal moqKg,
        Integer stock,
        Integer leadTimeDays,
        Boolean coaAvailable,
        Boolean msdsAvailable,
        Boolean exportReady,
        String moderationStatus,
        BestMatchExplanationDto bestMatch,
        LocalDateTime addedAt
) {}

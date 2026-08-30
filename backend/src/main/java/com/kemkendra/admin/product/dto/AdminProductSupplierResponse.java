package com.kemkendra.admin.product.dto;

import com.kemkendra.identity.UserStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminProductSupplierResponse(
        Long id,
        UUID productId,
        String productName,
        Long supplierId,
        String supplierName,
        String supplierCountry,
        Boolean supplierVerified,
        UserStatus supplierUserStatus,
        String purity,
        String grade,
        BigDecimal moqKg,
        String packaging,
        Integer leadTimeDays,
        Boolean coaAvailable,
        Boolean msdsAvailable,
        LocalDateTime createdAt
) {
}

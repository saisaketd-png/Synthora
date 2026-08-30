package com.kemkendra.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Management-layer response for a supplier's own ProductSupplier association.
 * <p>
 * Exposes the association ID and productId so the supplier can edit/delete
 * their specific offering. Does not expose supplierId, userId, email, or
 * any authentication internals.
 * </p>
 */
public record ProductSupplierManageResponse(
        Long id,
        UUID productId,
        String productName,
        String purity,
        String grade,
        BigDecimal moqKg,
        String packaging,
        Integer leadTimeDays,
        Boolean coaAvailable,
        Boolean msdsAvailable,
        LocalDateTime createdAt
) {}

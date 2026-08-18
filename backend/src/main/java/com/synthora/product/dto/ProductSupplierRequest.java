package com.synthora.product.dto;

import java.math.BigDecimal;

/**
 * Request DTO for creating or updating a supplier's product offering.
 * <p>
 * Only exposes the ProductSupplier commercial fields. Supplier identity
 * is derived server-side from the authenticated principal — never accepted from
 * the client.
 * </p>
 */
public record ProductSupplierRequest(
        String purity,
        String grade,
        BigDecimal moqKg,
        String packaging,
        Integer leadTimeDays,
        Boolean coaAvailable,
        Boolean msdsAvailable
) {}

package com.kemkendra.product.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

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
        @Size(max = 100, message = "Purity description too long")
        String purity,

        @Size(max = 100, message = "Grade description too long")
        String grade,

        @DecimalMin(value = "0.0", message = "MOQ cannot be negative")
        @DecimalMax(value = "999999999.99", message = "MOQ is too large")
        BigDecimal moqKg,

        @Size(max = 150, message = "Packaging description too long")
        String packaging,

        @Min(value = 0, message = "Lead time cannot be negative")
        @Max(value = 3650, message = "Lead time must not exceed 3650 days")
        Integer leadTimeDays,

        Boolean coaAvailable,

        Boolean msdsAvailable
) {}

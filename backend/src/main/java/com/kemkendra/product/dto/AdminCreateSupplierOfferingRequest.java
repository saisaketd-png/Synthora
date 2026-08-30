package com.kemkendra.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record AdminCreateSupplierOfferingRequest(
        @NotNull(message = "Supplier ID is required")
        Long supplierId,

        @NotNull(message = "Master Product ID is required")
        UUID masterProductId,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than zero")
        BigDecimal price,

        String currency,
        Integer stock,
        BigDecimal purity,
        String grade,
        BigDecimal moqKg,
        String packaging,
        Integer leadTimeDays,
        Boolean coaAvailable,
        Boolean msdsAvailable,
        Boolean exportReady,
        String availabilityStatus,
        String moderationStatus,
        String adminNotes
) {}

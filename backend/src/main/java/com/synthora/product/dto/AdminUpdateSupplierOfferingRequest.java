package com.synthora.product.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public record AdminUpdateSupplierOfferingRequest(
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
        String moderationNotes,
        String adminNotes
) {}

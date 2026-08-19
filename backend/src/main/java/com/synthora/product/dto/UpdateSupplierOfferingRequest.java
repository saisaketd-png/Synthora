package com.synthora.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateSupplierOfferingRequest(
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        BigDecimal price,

        @Size(max = 10, message = "Currency code cannot exceed 10 characters")
        String currency,

        @Min(value = 0, message = "Stock cannot be negative")
        Integer stock,

        BigDecimal purity,

        @Size(max = 100, message = "Grade cannot exceed 100 characters")
        String grade,

        BigDecimal moqKg,

        @Size(max = 150, message = "Packaging details cannot exceed 150 characters")
        String packaging,

        Integer leadTimeDays,

        Boolean coaAvailable,

        Boolean msdsAvailable,

        Boolean exportReady,

        String availabilityStatus
) {}

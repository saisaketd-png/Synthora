package com.synthora.rfq.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateRfqRequest(

        @NotNull(message = "Product ID is required")
        UUID productId,

        UUID masterProductId,

        UUID supplierOfferingId,

        @NotNull(message = "Supplier ID is required")
        Long supplierId,

        List<Long> targetSupplierIds,

        @NotNull(message = "Quantity is required")
        @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
        @DecimalMax(value = "999999999.99", message = "Quantity is too large")
        BigDecimal quantity,

        @NotBlank(message = "Unit is required")
        @Size(max = 20, message = "Unit must not exceed 20 characters")
        String unit,

        @Size(max = 2000, message = "Message must not exceed 2000 characters")
        String message,

        Integer expiryDays
) {
    public CreateRfqRequest(UUID productId, Long supplierId, BigDecimal quantity, String unit, String message) {
        this(productId, null, null, supplierId, null, quantity, unit, message, null);
    }

    public CreateRfqRequest(UUID productId, UUID masterProductId, UUID supplierOfferingId, Long supplierId, List<Long> targetSupplierIds, BigDecimal quantity, String unit, String message) {
        this(productId, masterProductId, supplierOfferingId, supplierId, targetSupplierIds, quantity, unit, message, null);
    }
}
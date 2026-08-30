package com.kemkendra.rfq.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateCounterOfferRequest(
        @NotNull(message = "Unit price is required")
        @DecimalMin(value = "0.0001", message = "Unit price must be greater than zero")
        BigDecimal unitPrice,

        @NotBlank(message = "Currency is required")
        @Size(max = 10, message = "Currency code must not exceed 10 characters")
        String currency,

        @DecimalMin(value = "0.0001", message = "Minimum order quantity must be greater than zero")
        BigDecimal minimumOrderQuantity,

        Integer leadTimeDays,

        String packagingDetails,

        @NotBlank(message = "Commercial message is required")
        @Size(max = 2000, message = "Commercial message must not exceed 2000 characters")
        String commercialMessage
) {
}

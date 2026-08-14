package com.synthora.rfq.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateRfqRequest(

        @NotNull
        UUID buyerId,

        @NotNull
        UUID productId,

        @NotNull
        Long supplierId,

        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal quantity,

        @NotBlank
        String unit,

        String message
) {
}
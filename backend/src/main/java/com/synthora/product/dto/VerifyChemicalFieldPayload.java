package com.synthora.product.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyChemicalFieldPayload(
        @NotBlank String fieldName,
        @NotBlank String status,
        String notes
) {}

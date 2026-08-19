package com.synthora.product.dto;

import jakarta.validation.constraints.NotBlank;

public record FlagOfferingPayload(
        @NotBlank String reason,
        boolean flagged
) {}

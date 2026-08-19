package com.synthora.product.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestProductInfoPayload(
        @NotBlank(message = "Reason / information requested is required")
        String adminNotes
) {}

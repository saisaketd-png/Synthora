package com.kemkendra.product.dto;

import jakarta.validation.constraints.NotBlank;

public record RequestProductInfoPayload(
        @NotBlank(message = "Reason / information requested is required")
        String adminNotes
) {}

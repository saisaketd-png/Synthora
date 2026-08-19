package com.synthora.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectProductRequestPayload(
        @NotBlank(message = "Rejection reason is required")
        @Size(max = 2000)
        String rejectionReason
) {}

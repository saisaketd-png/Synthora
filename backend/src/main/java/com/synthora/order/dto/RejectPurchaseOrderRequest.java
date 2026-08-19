package com.synthora.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectPurchaseOrderRequest(
        @NotBlank(message = "Rejection reason is required")
        @Size(min = 5, max = 1000, message = "Rejection reason must be between 5 and 1000 characters")
        String reason
) {
}

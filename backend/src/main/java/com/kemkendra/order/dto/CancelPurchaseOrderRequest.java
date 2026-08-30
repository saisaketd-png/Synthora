package com.kemkendra.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelPurchaseOrderRequest(
        @NotBlank(message = "Cancellation reason is required")
        @Size(min = 5, max = 1000, message = "Cancellation reason must be between 5 and 1000 characters")
        String reason
) {}

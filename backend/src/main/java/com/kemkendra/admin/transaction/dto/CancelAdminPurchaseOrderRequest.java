package com.kemkendra.admin.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelAdminPurchaseOrderRequest(
        @NotBlank(message = "Cancellation reason cannot be blank")
        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}

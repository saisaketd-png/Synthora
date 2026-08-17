package com.synthora.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePurchaseOrderRequest(
        @NotNull(message = "RFQ ID is required")
        UUID rfqId,

        @NotBlank(message = "Shipping address is required")
        @Size(max = 1000, message = "Shipping address must not exceed 1000 characters")
        String shippingAddress,

        @NotBlank(message = "Billing contact is required")
        @Size(max = 255, message = "Billing contact must not exceed 255 characters")
        String billingContact,

        @Size(max = 2000, message = "Notes must not exceed 2000 characters")
        String notes
) {}

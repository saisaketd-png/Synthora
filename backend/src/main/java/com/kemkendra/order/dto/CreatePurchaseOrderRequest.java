package com.kemkendra.order.dto;

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
        String notes,

        @Size(max = 100, message = "Payment terms must not exceed 100 characters")
        String paymentTerms,

        @Size(max = 100, message = "Delivery terms must not exceed 100 characters")
        String deliveryTerms,

        @Size(max = 50, message = "Incoterms must not exceed 50 characters")
        String incoterms
) {
    public CreatePurchaseOrderRequest(UUID rfqId, String shippingAddress, String billingContact, String notes) {
        this(rfqId, shippingAddress, billingContact, notes, null, null, null);
    }
}

package com.synthora.admin.supplier.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSupplierVerificationRequest(
        @NotNull(message = "Verification status cannot be null")
        Boolean verified,

        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}

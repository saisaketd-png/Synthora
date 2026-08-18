package com.synthora.admin.supplier.dto;

import com.synthora.identity.UserStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSupplierStatusRequest(
        @NotNull(message = "Status cannot be null")
        UserStatus status,

        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}

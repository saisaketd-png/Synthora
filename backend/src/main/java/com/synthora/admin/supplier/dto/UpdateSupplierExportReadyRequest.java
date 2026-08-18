package com.synthora.admin.supplier.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSupplierExportReadyRequest(
        @NotNull(message = "Export-ready status cannot be null")
        Boolean exportReady,

        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}

package com.kemkendra.admin.transaction.dto;

import com.kemkendra.rfq.RfqStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateAdminRfqStatusRequest(
        @NotNull(message = "Status cannot be null")
        RfqStatus status,

        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}

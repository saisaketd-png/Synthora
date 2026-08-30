package com.kemkendra.rfq.dto;

import jakarta.validation.constraints.Size;

public record RejectQuotationRequest(
        @Size(max = 2000, message = "Rejection reason must not exceed 2000 characters")
        String rejectionReason
) {}

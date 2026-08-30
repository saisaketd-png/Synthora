package com.kemkendra.rfq.dto;

import jakarta.validation.constraints.Size;

public record AcceptQuotationRequest(
        @Size(max = 2000, message = "Decision notes must not exceed 2000 characters")
        String decisionNotes
) {}

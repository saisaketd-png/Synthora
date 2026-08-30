package com.synthora.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitAppealRequest(
        @NotBlank(message = "Appeal reason is mandatory")
        @Size(min = 10, max = 4000, message = "Appeal reason must be between 10 and 4000 characters")
        String reason
) {}

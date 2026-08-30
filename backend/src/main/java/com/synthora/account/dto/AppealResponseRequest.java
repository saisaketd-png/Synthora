package com.synthora.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AppealResponseRequest(
        @NotBlank(message = "Response content is mandatory")
        @Size(min = 5, max = 4000, message = "Response must be between 5 and 4000 characters")
        String response
) {}

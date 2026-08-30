package com.synthora.identity.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyEmailRequest(

        @NotBlank(message = "Verification token is required")
        String token
) {
}

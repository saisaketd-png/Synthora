package com.synthora.identity.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Name is required")
        @Size(max = 255, message = "Name must not exceed 255 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @Size(max = 50, message = "Phone must not exceed 50 characters")
        String phone,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        String password,

        @NotNull(message = "Terms of Service must be accepted")
        @AssertTrue(message = "Terms of Service must be accepted")
        Boolean termsAccepted,

        @NotNull(message = "Privacy Policy must be accepted")
        @AssertTrue(message = "Privacy Policy must be accepted")
        Boolean privacyAccepted
) {
    public RegisterRequest(String name, String email, String phone, String password) {
        this(name, email, phone, password, false, false);
    }
}
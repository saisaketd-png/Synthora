package com.synthora.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupplierRegisterRequest(

        @NotBlank(message = "Contact name is required")
        @Size(max = 255, message = "Contact name must not exceed 255 characters")
        String name,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Size(max = 255, message = "Email must not exceed 255 characters")
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
        String password,

        @NotBlank(message = "Company name is required")
        @Size(max = 150, message = "Company name must not exceed 150 characters")
        String companyName,

        @NotBlank(message = "Country is required")
        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country,

        @Size(max = 10, message = "Country code must not exceed 10 characters")
        String countryCode,

        @Size(max = 50, message = "Phone must not exceed 50 characters")
        String phone,

        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @Size(max = 200, message = "Website must not exceed 200 characters")
        String website,

        @Size(max = 2000, message = "About company must not exceed 2000 characters")
        String aboutCompany
) {
}

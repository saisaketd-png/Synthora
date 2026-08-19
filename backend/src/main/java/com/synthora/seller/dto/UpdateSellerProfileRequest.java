package com.synthora.seller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateSellerProfileRequest(

        @NotBlank(message = "Company name is required")
        @Size(max = 150, message = "Company name must not exceed 150 characters")
        String companyName,

        @Size(max = 50, message = "GST number must not exceed 50 characters")
        String gstNumber,

        @Size(max = 500, message = "Address must not exceed 500 characters")
        String address,

        @Size(max = 100, message = "City must not exceed 100 characters")
        String city,

        @Size(max = 100, message = "State must not exceed 100 characters")
        String state,

        @Size(max = 100, message = "Country must not exceed 100 characters")
        String country,

        @Size(max = 200, message = "Website URL must not exceed 200 characters")
        @Pattern(regexp = "^(https?://)?[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}(/.*)?$|^$", message = "Invalid website URL format")
        String website,

        @Size(max = 500, message = "Certifications must not exceed 500 characters")
        String certifications,

        @Size(max = 2000, message = "About company description must not exceed 2000 characters")
        String aboutCompany
) {
}
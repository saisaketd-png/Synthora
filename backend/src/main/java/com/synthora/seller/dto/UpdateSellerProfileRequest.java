package com.synthora.seller.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSellerProfileRequest(

        @NotBlank(message = "Company name is required")
        @Size(max = 150)
        String companyName,

        @Size(max = 50)
        String gstNumber,

        @Size(max = 500)
        String address,

        @Size(max = 100)
        String city,

        @Size(max = 100)
        String state,

        @Size(max = 100)
        String country,

        @Size(max = 200)
        String website,

        @Size(max = 500)
        String certifications,

        @Size(max = 2000)
        String aboutCompany
) {
}
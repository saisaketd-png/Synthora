package com.synthora.admin.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProductAvailabilityRequest(
        @NotBlank(message = "Availability status cannot be blank")
        String availabilityStatus,

        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}

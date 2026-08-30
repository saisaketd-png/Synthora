package com.kemkendra.rfq.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateQuotationRequest(
        @NotNull(message = "Unit price is required")
        @Positive(message = "Unit price must be positive")
        @DecimalMax(value = "999999999.9999", message = "Unit price is too large")
        @Digits(integer = 14, fraction = 4, message = "Unit price format is invalid")
        BigDecimal unitPrice,

        @NotBlank(message = "Currency is required")
        @Size(max = 10, message = "Currency must not exceed 10 characters")
        String currency,

        @Positive(message = "MOQ must be positive")
        @DecimalMax(value = "999999999.9999", message = "MOQ is too large")
        @Digits(integer = 14, fraction = 4, message = "MOQ format is invalid")
        BigDecimal minimumOrderQuantity,

        @Positive(message = "Lead time must be positive")
        @Max(value = 3650, message = "Lead time must not exceed 3650 days")
        Integer leadTimeDays,

        @NotNull(message = "Validity date is required")
        @Future(message = "Validity date must be in the future")
        LocalDate validityDate,

        @Size(max = 255, message = "Packaging details must not exceed 255 characters")
        String packagingDetails,

        @Size(max = 2000, message = "Commercial notes must not exceed 2000 characters")
        String commercialNotes
) {
}

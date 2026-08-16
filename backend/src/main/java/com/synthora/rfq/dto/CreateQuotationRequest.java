package com.synthora.rfq.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateQuotationRequest(
        @NotNull
        @Positive
        @Digits(integer = 14, fraction = 4)
        BigDecimal unitPrice,

        @NotBlank
        @Size(max = 10)
        String currency,

        @Positive
        @Digits(integer = 14, fraction = 4)
        BigDecimal minimumOrderQuantity,

        @Positive
        Integer leadTimeDays,

        @NotNull
        @Future
        LocalDate validityDate,

        String packagingDetails,

        String commercialNotes
) {
}

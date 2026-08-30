package com.kemkendra.product.dto;

import jakarta.validation.constraints.NotBlank;

public record RespondProductInfoPayload(
        @NotBlank(message = "Response notes are required")
        String supplierResponseNotes,

        String correctedName,
        String correctedCas,
        String correctedFormula
) {}

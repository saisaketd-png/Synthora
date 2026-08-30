package com.kemkendra.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddSynonymPayload(
        @NotBlank(message = "Synonym cannot be blank")
        @Size(max = 255, message = "Synonym must be 255 characters or less")
        String synonym
) {}

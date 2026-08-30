package com.kemkendra.product.dto;

import com.kemkendra.product.ProductCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ApproveProductRequestPayload(
        @NotBlank(message = "Chemical name is required")
        @Size(max = 255)
        String canonicalName,

        @Size(max = 100)
        String casNumber,

        @Size(max = 100)
        String molecularFormula,

        @NotNull(message = "Category is required")
        ProductCategory category,

        @Size(max = 2000)
        String description
) {}

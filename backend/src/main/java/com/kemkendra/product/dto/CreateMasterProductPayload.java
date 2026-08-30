package com.kemkendra.product.dto;

import com.kemkendra.product.ProductCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateMasterProductPayload(
        @NotBlank(message = "Chemical name is required")
        String name,

        String casNumber,
        String molecularFormula,

        @NotNull(message = "Category is required")
        ProductCategory category,

        String description,
        String status
) {}

package com.kemkendra.product.dto;

import com.kemkendra.product.ProductCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateProductRequestRequest(
        @NotBlank(message = "Proposed chemical name is required")
        @Size(max = 255, message = "Proposed chemical name cannot exceed 255 characters")
        String proposedName,

        @Size(max = 100, message = "CAS number cannot exceed 100 characters")
        String casNumber,

        @Size(max = 100, message = "Molecular formula cannot exceed 100 characters")
        String molecularFormula,

        @NotNull(message = "Category is required")
        ProductCategory category,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        @Size(max = 2000, message = "Supplier message cannot exceed 2000 characters")
        String supplierMessage
) {}

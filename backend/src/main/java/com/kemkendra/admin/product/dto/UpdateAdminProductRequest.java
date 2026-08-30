package com.kemkendra.admin.product.dto;

import com.kemkendra.product.ProductCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateAdminProductRequest(
        @NotBlank(message = "Product name cannot be blank")
        @Size(max = 255, message = "Product name cannot exceed 255 characters")
        String name,

        @Size(max = 2000, message = "Description cannot exceed 2000 characters")
        String description,

        @NotNull(message = "Price cannot be null")
        @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
        BigDecimal price,

        @NotNull(message = "Stock cannot be null")
        @Min(value = 0, message = "Stock cannot be negative")
        Integer stock,

        @NotNull(message = "Category cannot be null")
        ProductCategory category,

        @Size(max = 100)
        String casNumber,

        @Size(max = 100)
        String molecularFormula,

        BigDecimal purity,

        @Size(max = 100)
        String grade,

        @Size(max = 150)
        String packaging,

        BigDecimal moqKg,

        Integer leadTimeDays,

        Boolean coaAvailable,

        Boolean msdsAvailable,

        Boolean exportReady,

        @Size(max = 50)
        String availabilityStatus,

        @Size(max = 500, message = "Reason cannot exceed 500 characters")
        String reason
) {
}

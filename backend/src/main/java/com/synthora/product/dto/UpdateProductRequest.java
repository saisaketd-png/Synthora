package com.synthora.product.dto;

import com.synthora.product.ProductCategory;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record UpdateProductRequest(

        @NotBlank(message = "Product name is required")
        @Size(max = 255, message = "Product name must not exceed 255 characters")
        String name,

        @Size(max = 2000, message = "Description too long")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        @DecimalMax(value = "999999999.99", message = "Price is too large")
        BigDecimal price,

        @NotNull(message = "Category is required")
        ProductCategory category,

        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock cannot be negative")
        @Max(value = 1000000000, message = "Stock exceeds maximum permitted quantity")
        Integer stock,

        @Size(max = 100, message = "CAS number too long")
        String casNumber,

        @Size(max = 100, message = "Molecular formula too long")
        String molecularFormula,

        @DecimalMin(value = "0.0", message = "Purity cannot be negative")
        @DecimalMax(value = "100.0", message = "Purity cannot exceed 100")
        BigDecimal purity,

        @Size(max = 100, message = "Grade description too long")
        String grade,

        @DecimalMin(value = "0.0", message = "MOQ cannot be negative")
        @DecimalMax(value = "999999999.99", message = "MOQ is too large")
        BigDecimal moqKg,

        @Size(max = 150, message = "Packaging description too long")
        String packaging,

        @Min(value = 0, message = "Lead time cannot be negative")
        @Max(value = 3650, message = "Lead time must not exceed 3650 days")
        Integer leadTimeDays,

        Boolean coaAvailable,

        Boolean msdsAvailable,

        Boolean exportReady,

        @Size(max = 50, message = "Availability status too long")
        String availabilityStatus

) {
}
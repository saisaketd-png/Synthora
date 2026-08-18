package com.synthora.product.dto;

import com.synthora.product.ProductCategory;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record UpdateProductRequest(

        @NotBlank(message = "Product name is required")
        String name,

        @Size(max = 2000, message = "Description too long")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.01", message = "Price must be greater than 0")
        BigDecimal price,

        @NotNull(message = "Category is required")
        ProductCategory category,

        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock cannot be negative")
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

        @Min(value = 0, message = "MOQ cannot be negative")
        BigDecimal moqKg,

        @Size(max = 150, message = "Packaging description too long")
        String packaging,

        @Min(value = 0, message = "Lead time cannot be negative")
        Integer leadTimeDays,

        Boolean coaAvailable,

        Boolean msdsAvailable,

        Boolean exportReady,

        @Size(max = 50, message = "Availability status too long")
        String availabilityStatus

) {
}
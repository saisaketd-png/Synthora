package com.synthora.product.dto;

import com.synthora.product.ProductCategory;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record CreateProductRequest(

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
        Integer stock

) {
}
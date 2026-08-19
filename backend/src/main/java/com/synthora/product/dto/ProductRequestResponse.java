package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductRequestResponse(
        UUID id,
        Long supplierId,
        String supplierName,
        String proposedName,
        String casNumber,
        String molecularFormula,
        ProductCategory category,
        String description,
        String supplierMessage,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}

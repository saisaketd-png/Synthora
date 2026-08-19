package com.synthora.product.dto;

import com.synthora.product.ProductCategory;

public record UpdateMasterProductPayload(
        String name,
        String casNumber,
        String molecularFormula,
        ProductCategory category,
        String description,
        String status,
        String updateReason
) {}

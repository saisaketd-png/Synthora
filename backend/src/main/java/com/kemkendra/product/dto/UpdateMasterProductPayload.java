package com.kemkendra.product.dto;

import com.kemkendra.product.ProductCategory;

public record UpdateMasterProductPayload(
        String name,
        String casNumber,
        String molecularFormula,
        ProductCategory category,
        String description,
        String status,
        String updateReason
) {}

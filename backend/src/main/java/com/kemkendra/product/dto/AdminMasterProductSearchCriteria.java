package com.kemkendra.product.dto;

import com.kemkendra.product.ProductCategory;

public record AdminMasterProductSearchCriteria(
        String query,
        String casNumber,
        String masterProductCode,
        ProductCategory category,
        String status,
        Long supplierId,
        Boolean supplierVerified,
        Integer page,
        Integer size,
        String sort
) {
    public AdminMasterProductSearchCriteria {
        if (page == null || page < 0) page = 0;
        if (size == null || size < 1) size = 20;
        if (size > 100) size = 100;
    }
}

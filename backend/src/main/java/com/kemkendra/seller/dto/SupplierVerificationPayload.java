package com.kemkendra.seller.dto;

import com.kemkendra.seller.SupplierVerificationStatus;

public record SupplierVerificationPayload(
        SupplierVerificationStatus status,
        String notes
) {}

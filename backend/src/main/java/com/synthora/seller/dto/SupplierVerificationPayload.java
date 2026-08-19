package com.synthora.seller.dto;

import com.synthora.seller.SupplierVerificationStatus;

public record SupplierVerificationPayload(
        SupplierVerificationStatus status,
        String notes
) {}

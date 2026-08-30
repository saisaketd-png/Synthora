package com.kemkendra.seller.dto;

import com.kemkendra.seller.SupplierVerificationStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record SupplierVerificationAuditResponse(
        UUID id,
        UUID supplierId,
        UUID adminId,
        String adminName,
        SupplierVerificationStatus previousStatus,
        SupplierVerificationStatus newStatus,
        String notes,
        LocalDateTime timestamp
) {}

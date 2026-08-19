package com.synthora.seller.verification.dto;

import java.util.List;

public record SupplierVerificationWorkspaceDto(
        Long supplierId,
        String companyName,
        String legalName,
        String businessType,
        String verificationStatus,
        int completenessPercentage,
        SupplierCompletenessDto completenessDetails,
        List<VerificationChecklistItemDto> checklist,
        List<VerificationAuditDto> auditHistory,
        long offeringCount,
        String adminRequestNotes,
        String supplierResponseNotes,
        String verificationNotes
) {}

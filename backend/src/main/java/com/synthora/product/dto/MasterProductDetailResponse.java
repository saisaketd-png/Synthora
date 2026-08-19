package com.synthora.product.dto;

import com.synthora.governance.dto.GovernanceAuditLogResponse;
import com.synthora.product.ProductCategory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record MasterProductDetailResponse(
        UUID id,
        String masterProductCode,
        String name,
        String casNumber,
        String molecularFormula,
        ProductCategory category,
        String description,
        String status,
        int offeringCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<SupplierOfferingResponse> offerings,
        List<ProductRequestResponse> requestHistory,
        List<GovernanceAuditLogResponse> auditLogs,
        List<CatalogImageResponse> images,
        List<String> documents
) {}

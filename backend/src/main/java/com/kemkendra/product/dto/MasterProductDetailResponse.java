package com.kemkendra.product.dto;

import com.kemkendra.document.DocumentResponse;
import com.kemkendra.governance.dto.GovernanceAuditLogResponse;
import com.kemkendra.product.ProductCategory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
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
        List<DocumentResponse> documents,
        List<ProductSynonymResponse> synonyms,
        Map<String, String> verifiedFields
) {
    public MasterProductDetailResponse(
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
            List<DocumentResponse> documents,
            List<ProductSynonymResponse> synonyms
    ) {
        this(id, masterProductCode, name, casNumber, molecularFormula, category, description,
                status, offeringCount, createdAt, updatedAt, offerings, requestHistory, auditLogs,
                images, documents, synonyms, Map.of());
    }

    public MasterProductDetailResponse(
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
            List<DocumentResponse> documents
    ) {
        this(id, masterProductCode, name, casNumber, molecularFormula, category, description,
                status, offeringCount, createdAt, updatedAt, offerings, requestHistory, auditLogs,
                images, documents, List.of(), Map.of());
    }
}

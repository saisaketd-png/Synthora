package com.kemkendra.admin.operations.dto;

import com.kemkendra.product.ProductCategory;
import com.kemkendra.seller.SupplierVerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class AdminOperationsDtos {

    public record CatalogKpis(
            long activeMasterProducts,
            long draftMasterProducts,
            long inactiveMasterProducts,
            long mergedMasterProducts,
            long productsRequiringVerification,
            long duplicateCandidates,
            long productsWithoutEligibleOfferings
    ) {}

    public record SupplierKpis(
            long pendingVerification,
            long underReview,
            long informationRequired,
            long verified,
            long rejected,
            long suspended
    ) {}

    public record OfferingKpis(
            long pendingReview,
            long underReview,
            long informationRequired,
            long approved,
            long flagged,
            long rejected,
            long suspended,
            long missingRequiredDocuments
    ) {}

    public record RequestKpis(
            long pendingProductRequests,
            long informationRequired,
            long recentlyApproved,
            long recentlyRejected
    ) {}

    public record AdminKpiSummaryResponse(
            CatalogKpis catalog,
            SupplierKpis suppliers,
            OfferingKpis offerings,
            RequestKpis requests
    ) {}

    public record ActionCenterItemResponse(
            String id,
            String category,
            String priority,
            String title,
            String reason,
            long count,
            String targetUrl
    ) {}

    public record MasterProductQualityItemResponse(
            UUID id,
            String masterProductCode,
            String name,
            String casNumber,
            ProductCategory category,
            int qualityScore,
            String status,
            int issueCount,
            String highestPriorityIssue,
            Map<String, String> dimensionStatuses,
            LocalDateTime lastUpdated
    ) {}

    public record SupplierQualityItemResponse(
            Long supplierId,
            String companyName,
            String businessType,
            SupplierVerificationStatus verificationStatus,
            int completenessScore,
            int verificationProgress,
            long missingEvidenceCount,
            long flaggedEvidenceCount,
            long expiredDocumentsCount,
            long activeOfferings,
            long pendingOfferings,
            long flaggedOfferings,
            long suspendedOfferings,
            LocalDateTime lastActivity
    ) {}

    public record SupplierOfferingQualityItemResponse(
            UUID id,
            String masterProductCode,
            String productName,
            Long supplierId,
            String supplierName,
            BigDecimal unitPrice,
            String currency,
            BigDecimal purityPercentage,
            String grade,
            BigDecimal minimumOrderQuantity,
            String packagingDescription,
            Integer leadTimeDays,
            String availabilityStatus,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            String moderationStatus,
            int completenessScore,
            int verifiedDimensionsCount,
            int issueCount,
            Map<String, String> dimensionStatuses,
            LocalDateTime lastUpdated
    ) {}

    public record AdminSearchResultItem(
            String entityType,
            String identifier,
            String displayName,
            String status,
            String summary,
            String targetUrl,
            LocalDateTime lastUpdated
    ) {}

    public record GovernanceQueueItem(
            String id,
            String priority,
            String entityType,
            String entityIdentifier,
            String entityName,
            String issue,
            String currentState,
            LocalDateTime detectedAt,
            String workflowName,
            String actionUrl
    ) {}
}

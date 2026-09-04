package com.kemkendra.admin.operations.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
            String urgency,
            String title,
            String description,
            long count,
            String actionUrl
    ) {}

    public record ActionCenterSummaryResponse(
            List<ActionCenterItemResponse> items,
            long totalPendingActions,
            long highUrgencyCount
    ) {}

    public record CategoryBreakdownDto(
            ProductCategory category,
            long masterProductCount,
            long activeOfferingCount,
            long pendingOfferingCount
    ) {}

    public record CatalogHealthMetricsResponse(
            long totalMasterProducts,
            long activeMasterProducts,
            long draftMasterProducts,
            long inactiveMasterProducts,
            long verifiedMasterProducts,
            long totalOfferings,
            long activeOfferings,
            long pendingOfferings,
            long flaggedOfferings,
            long rejectedOfferings,
            long suspendedOfferings,
            long totalProductRequests,
            long pendingProductRequests,
            long approvedProductRequests,
            long rejectedProductRequests,
            List<CategoryBreakdownDto> categoryDistribution
    ) {}

    public record VerificationBacklogTrendDto(
            String period,
            long submittedCount,
            long verifiedCount,
            long rejectedCount
    ) {}

    public record CountryDistributionDto(
            String country,
            long supplierCount,
            long verifiedCount
    ) {}

    public record SupplierVerificationPipelineResponse(
            long draftCount,
            long submittedCount,
            long underReviewCount,
            long informationRequestedCount,
            long verifiedCount,
            long rejectedCount,
            long suspendedCount,
            long totalSuppliers,
            double averageReviewTimeDays,
            long overdueReviewsCount,
            List<CountryDistributionDto> geographicDistribution,
            List<VerificationBacklogTrendDto> monthlyTrend
    ) {}

    public record UserSnapshot(
            long totalUsers,
            long activeUsers,
            long suspendedUsers,
            long pendingVerificationUsers,
            long buyerCount,
            long supplierUserCount,
            long adminCount
    ) {}

    public record SupplierSnapshot(
            long totalSuppliers,
            long verifiedSuppliers,
            long pendingSuppliers,
            long underReviewSuppliers,
            long informationRequiredSuppliers,
            long rejectedSuppliers,
            long suspendedSuppliers
    ) {}

    public record CatalogSnapshot(
            long activeMasterProducts,
            long draftMasterProducts,
            long inactiveMasterProducts,
            long activeOfferings,
            long pendingOfferings,
            long underReviewOfferings,
            long flaggedOfferings
    ) {}

    public record MarketplaceSnapshot(
            long activeRfqs,
            long closedRfqs,
            long pendingQuotations,
            long acceptedQuotations,
            long activeOrders,
            long fulfilledOrders,
            long activeShipments,
            long deliveredShipments
    ) {}

    public record GovernanceSnapshot(
            long activeSuspensions,
            long openAppeals,
            long underReviewAppeals,
            long infoRequiredAppeals
    ) {}

    public record CommunicationSnapshot(
            long totalNotifications,
            long unreadNotifications,
            long notificationsToday
    ) {}

    public record PolicySnapshot(
            boolean maintenanceModeActive,
            long activeFeatureFlags,
            long totalSettings,
            long publishedAnnouncements
    ) {}

    public record PlatformSnapshotResponse(
            UserSnapshot users,
            SupplierSnapshot suppliers,
            CatalogSnapshot catalog,
            MarketplaceSnapshot marketplace,
            GovernanceSnapshot governance,
            CommunicationSnapshot communication,
            PolicySnapshot policies,
            LocalDateTime generatedAt
    ) {}

    public record AttentionQueueItem(
            String id,
            String category,
            String priority,
            long count,
            String title,
            String description,
            String actionUrl,
            String actionLabel
    ) {}

    public record AdminMarketplaceQuotationDto(
            UUID id,
            UUID rfqId,
            Long supplierId,
            String supplierName,
            BigDecimal unitPrice,
            String currency,
            BigDecimal quantity,
            Integer leadTimeDays,
            String status,
            LocalDateTime createdAt
    ) {}

    public record AdminMarketplaceShipmentDto(
            UUID id,
            UUID purchaseOrderId,
            String poNumber,
            Long supplierId,
            String supplierName,
            String carrier,
            String trackingNumber,
            String status,
            LocalDateTime estimatedDeliveryDate,
            LocalDateTime createdAt
    ) {}

    public record MasterProductQualityItemResponse(
            UUID id,
            String masterProductCode,
            String name,
            String casNumber,
            ProductCategory category,
            int score,
            String status,
            int issueCount,
            String primaryIssue,
            Map<String, String> dimensionStatuses,
            LocalDateTime updatedAt
    ) {
        public int qualityScore() { return score(); }
    }

    public record SupplierQualityItemResponse(
            Long id,
            String name,
            String businessType,
            SupplierVerificationStatus verificationStatus,
            int compositeScore,
            int complianceScore,
            int openIssuesCount,
            int pendingReviewsCount,
            int overdueReviewsCount,
            long offeringCount,
            int verifiedOfferingsCount,
            int flaggedOfferingsCount,
            int pendingOfferingsCount,
            LocalDateTime updatedAt
    ) {
        @JsonProperty("supplierId")
        public Long supplierId() { return id(); }

        @JsonProperty("companyName")
        public String companyName() { return name(); }

        @JsonProperty("completenessScore")
        public int completenessScore() { return compositeScore(); }

        @JsonProperty("activeOfferings")
        public long activeOfferings() { return offeringCount(); }
    }

    public record SupplierOfferingQualityItemResponse(
            UUID id,
            String masterProductCode,
            String masterProductName,
            Long supplierId,
            String supplierName,
            BigDecimal price,
            String currency,
            BigDecimal purity,
            String grade,
            BigDecimal moqKg,
            String packaging,
            Integer leadTimeDays,
            String availabilityStatus,
            Boolean coaAvailable,
            Boolean msdsAvailable,
            Boolean exportReady,
            String moderationStatus,
            int qualityScore,
            int passedRulesCount,
            int failedRulesCount,
            Map<String, String> dimensionStatuses,
            LocalDateTime updatedAt
    ) {}

    public record AdminSearchResultItem(
            String type,
            String codeOrId,
            String title,
            String status,
            String subtitle,
            String linkUrl,
            LocalDateTime updatedAt
    ) {}

    public record GovernanceQueueItem(
            String id,
            String priority,
            String entityType,
            String entityId,
            String entityName,
            String issueDescription,
            String currentStatus,
            LocalDateTime submissionDate,
            String workflowName,
            String reviewUrl
    ) {}
}

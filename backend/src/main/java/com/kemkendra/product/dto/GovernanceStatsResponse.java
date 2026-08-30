package com.kemkendra.product.dto;

public record GovernanceStatsResponse(
        long activeMasterProducts,
        long draftMasterProducts,
        long pendingRequests,
        long approvedRequests,
        long rejectedRequests,
        long potentialDuplicates,
        long totalOfferings,
        long pendingOfferingReviews,
        long pendingSupplierVerifications,
        long verifiedSuppliersCount,
        long flaggedOfferingsCount
) {}

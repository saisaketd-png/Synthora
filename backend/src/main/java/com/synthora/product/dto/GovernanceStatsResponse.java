package com.synthora.product.dto;

public record GovernanceStatsResponse(
        long activeMasterProducts,
        long pendingRequests,
        long approvedRequests,
        long rejectedRequests,
        long potentialDuplicates,
        long totalOfferings
) {}

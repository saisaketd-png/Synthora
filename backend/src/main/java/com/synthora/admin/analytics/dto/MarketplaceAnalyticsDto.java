package com.synthora.admin.analytics.dto;

public record MarketplaceAnalyticsDto(
        long totalRfqs,
        long openRfqs,
        long acceptedRfqs,
        long rejectedRfqs,
        long closedRfqs,
        long cancelledRfqs,
        long periodRfqs,
        long totalQuotations,
        long periodQuotations,
        long acceptedQuotations,
        long rejectedQuotations
) {
}

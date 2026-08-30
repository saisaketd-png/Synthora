package com.kemkendra.admin.analytics.dto;

public record SupplierAnalyticsDto(
        long totalSuppliers,
        long pendingVerification,
        long underReview,
        long informationRequired,
        long verifiedSuppliers,
        long rejectedSuppliers,
        long suspendedSuppliers,
        long draftSuppliers,
        long periodRegistrations
) {
}

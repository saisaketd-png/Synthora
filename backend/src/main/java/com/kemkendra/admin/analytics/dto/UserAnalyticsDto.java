package com.kemkendra.admin.analytics.dto;

public record UserAnalyticsDto(
        long totalUsers,
        long totalBuyers,
        long totalSuppliers,
        long activeUsers,
        long suspendedUsers,
        long pendingUsers,
        long unverifiedEmailUsers,
        long periodRegistrations,
        long previousPeriodRegistrations,
        Double registrationsGrowthPercentage
) {
}

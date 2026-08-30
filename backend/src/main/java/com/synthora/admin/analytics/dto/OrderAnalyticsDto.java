package com.synthora.admin.analytics.dto;

public record OrderAnalyticsDto(
        long totalOrders,
        long periodOrders,
        long placedOrders,
        long confirmedOrders,
        long processingOrders,
        long shippedOrders,
        long deliveredOrders,
        long completedOrders,
        long cancelledOrders,
        long rejectedOrders
) {
}

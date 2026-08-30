package com.kemkendra.admin.analytics.dto;

import java.util.List;

public record AdminAnalyticsOverviewResponse(
        String period,
        String startDate,
        String endDate,
        String previousStartDate,
        String previousEndDate,
        UserAnalyticsDto users,
        SupplierAnalyticsDto suppliers,
        MarketplaceAnalyticsDto marketplace,
        OrderAnalyticsDto orders,
        CommercialAnalyticsDto commercial,
        ShipmentAnalyticsDto shipments,
        MarketplaceFunnelDto funnel,
        AnalyticsTrendsDto trends,
        List<ActionCenterCounterDto> actionCenter,
        List<RecentActivityDto> recentActivity
) {
}

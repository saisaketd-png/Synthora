package com.kemkendra.admin.analytics.dto;

import java.math.BigDecimal;

public record CommercialAnalyticsDto(
        BigDecimal totalGmv,
        BigDecimal periodGmv,
        BigDecimal previousPeriodGmv,
        Double gmvGrowthPercentage,
        BigDecimal averageOrderValue,
        Double rfqToQuotationConversionRate,
        Double quotationToOrderConversionRate,
        Double rfqToOrderConversionRate
) {
}

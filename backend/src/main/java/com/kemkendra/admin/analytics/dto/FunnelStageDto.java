package com.kemkendra.admin.analytics.dto;

public record FunnelStageDto(
        String stage,
        String label,
        long count,
        double conversionPercentage,
        double dropOffPercentage
) {
}

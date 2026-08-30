package com.kemkendra.admin.analytics.dto;

import java.util.List;

public record MarketplaceFunnelDto(
        List<FunnelStageDto> stages,
        double overallConversionRate
) {
}

package com.kemkendra.admin.analytics.dto;

import java.util.List;

public record AnalyticsTrendsDto(
        List<DataPointDto> userRegistrations,
        List<DataPointDto> rfqs,
        List<DataPointDto> quotations,
        List<DataPointDto> orders,
        List<DataPointDto> gmv
) {
}

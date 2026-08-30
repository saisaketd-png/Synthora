package com.kemkendra.product.dto;

public record SupplierPerformanceResponse(
        Long supplierId,
        Integer responseRate,
        Long averageResponseTimeSeconds,
        String formattedResponseTime,
        long totalRfqsReceived,
        long eligibleRfqs,
        long respondedRfqs,
        long unrespondedRfqs,
        long pendingRfqs
) {
}

package com.synthora.admin.dto;

public record TestDataResetReportResponse(
        int masterProductsDeleted,
        int offeringsDeleted,
        int productRequestsDeleted,
        int rfqsDeleted,
        int quotationsDeleted,
        int purchaseOrdersDeleted,
        int notificationsDeleted,
        int documentsDeleted,
        int imagesDeleted,
        String statusMessage
) {}

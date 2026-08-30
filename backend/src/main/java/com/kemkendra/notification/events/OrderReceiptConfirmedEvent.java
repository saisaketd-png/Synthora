package com.kemkendra.notification.events;

import java.util.UUID;

public record OrderReceiptConfirmedEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId
) {}

package com.kemkendra.notification.events;

import java.util.UUID;

/**
 * Fired after a supplier starts processing a Purchase Order.
 * Recipient: the buyer who issued the PO.
 */
public record OrderProcessingStartedEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId
) {}

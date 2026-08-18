package com.synthora.notification.events;

import java.util.UUID;

/**
 * Fired after a buyer successfully creates a Purchase Order.
 * Recipient: the supplier assigned to the PO.
 */
public record PurchaseOrderIssuedEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId
) {}

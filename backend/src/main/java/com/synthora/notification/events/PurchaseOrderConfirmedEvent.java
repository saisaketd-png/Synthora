package com.synthora.notification.events;

import java.util.UUID;

/**
 * Fired after a supplier confirms a Purchase Order.
 * Recipient: the buyer who issued the PO.
 */
public record PurchaseOrderConfirmedEvent(
        UUID purchaseOrderId,
        UUID buyerId,
        Long supplierId
) {}

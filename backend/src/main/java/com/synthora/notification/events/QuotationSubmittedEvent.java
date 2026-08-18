package com.synthora.notification.events;

import java.util.UUID;

/**
 * Fired after a supplier successfully submits a quotation on an RFQ.
 * Recipient: the buyer who owns the RFQ.
 */
public record QuotationSubmittedEvent(
        UUID quotationId,
        UUID rfqId,
        UUID buyerId,
        Long supplierId
) {}

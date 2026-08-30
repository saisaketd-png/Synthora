package com.kemkendra.notification.events;

import java.util.UUID;

/**
 * Fired after a buyer rejects all quotations on an RFQ.
 * Recipient: the supplier whose quotation was rejected.
 */
public record QuotationRejectedEvent(
        UUID quotationId,
        UUID rfqId,
        UUID buyerId,
        Long supplierId
) {}

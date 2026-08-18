package com.synthora.notification;

/**
 * Enumeration of notification types supported in Phase 2F.
 * <p>
 * Only types that map directly to verified domain events (Phase 2F.1 audit)
 * are listed here. Deferred and unsupported types are explicitly excluded.
 * </p>
 *
 * Verified domain events → types:
 * <ul>
 *   <li>RfqService.createRfq()                      → RFQ_SUBMITTED</li>
 *   <li>RfqService.submitQuotation()                 → QUOTATION_SUBMITTED</li>
 *   <li>RfqService.acceptQuotation()                 → QUOTATION_ACCEPTED</li>
 *   <li>RfqService.rejectQuotation()                 → QUOTATION_REJECTED</li>
 *   <li>PurchaseOrderService.createPurchaseOrder()   → PO_ISSUED</li>
 *   <li>PurchaseOrderService.confirmSupplierOrder()  → PO_CONFIRMED</li>
 *   <li>PurchaseOrderService.startProcessing()       → ORDER_PROCESSING_STARTED</li>
 *   <li>PurchaseOrderService.shipSupplierOrder()     → ORDER_SHIPPED</li>
 *   <li>PurchaseOrderService.markOrderDelivered()    → ORDER_DELIVERED</li>
 *   <li>DocumentService.uploadDocument()             → DOCUMENT_UPLOADED</li>
 * </ul>
 */
public enum NotificationType {

    // -----------------------------------------------------------------------
    // RFQ
    // -----------------------------------------------------------------------

    /** A buyer submitted a new RFQ. Recipient: targeted supplier. */
    RFQ_SUBMITTED,

    // -----------------------------------------------------------------------
    // Quotation
    // -----------------------------------------------------------------------

    /** A supplier submitted a quotation on an RFQ. Recipient: buyer. */
    QUOTATION_SUBMITTED,

    /** A buyer accepted a supplier's quotation. Recipient: supplier. */
    QUOTATION_ACCEPTED,

    /** A buyer rejected a supplier's quotation. Recipient: supplier. */
    QUOTATION_REJECTED,

    // -----------------------------------------------------------------------
    // Purchase Order
    // -----------------------------------------------------------------------

    /** A buyer issued a Purchase Order. Recipient: supplier. */
    PO_ISSUED,

    /** A supplier confirmed a Purchase Order. Recipient: buyer. */
    PO_CONFIRMED,

    // -----------------------------------------------------------------------
    // Fulfillment
    // -----------------------------------------------------------------------

    /** A supplier started processing an order. Recipient: buyer. */
    ORDER_PROCESSING_STARTED,

    /** A supplier created a shipment for an order. Recipient: buyer. */
    ORDER_SHIPPED,

    /** A supplier marked an order as delivered. Recipient: buyer. */
    ORDER_DELIVERED,

    // -----------------------------------------------------------------------
    // Documents
    // -----------------------------------------------------------------------

    /** A document was uploaded against a domain entity. Recipient: counterparty. */
    DOCUMENT_UPLOADED
}

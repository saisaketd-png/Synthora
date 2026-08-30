package com.kemkendra.notification;

/**
 * Represents the type of business entity a notification is linked to.
 * <p>
 * Used by the frontend to construct navigation links from a notification:
 * {@code notification.entityType + notification.entityId → route}
 * </p>
 *
 * Example routing:
 * <ul>
 *   <li>RFQ           → /dashboard/rfqs/{entityId}</li>
 *   <li>PURCHASE_ORDER → /dashboard/orders/{entityId}</li>
 *   <li>DOCUMENT      → resolved per ownerType in document domain</li>
 * </ul>
 *
 * Only entity types with active domain support (Phase 2F.1 audit) are included.
 */
public enum NotificationEntityType {

    /** An RFQ — maps to /dashboard/rfqs/{entityId} */
    RFQ,

    /** A quotation — maps to /dashboard/rfqs/{rfqId} (quotations are viewed on RFQ detail) */
    QUOTATION,

    /** A Purchase Order — maps to /dashboard/orders/{entityId} */
    PURCHASE_ORDER,

    /** A Shipment — maps via the parent PO to /dashboard/orders/{poId} */
    SHIPMENT,

    /** A document — navigation depends on document's ownerType */
    DOCUMENT,

    /** A product request submitted by a supplier */
    PRODUCT_REQUEST,

    /** A canonical master product */
    MASTER_PRODUCT,

    /** A supplier offering — maps to /dashboard/admin/catalog/offerings/{entityId} */
    SUPPLIER_OFFERING,

    /** A supplier profile/verification — maps to /dashboard/admin/catalog/verification/{entityId} */
    SUPPLIER,

    /** An account suspension — maps to /dashboard/account-review */
    ACCOUNT_SUSPENSION,

    /** An account suspension appeal — maps to /dashboard/account-review or admin governance */
    ACCOUNT_SUSPENSION_APPEAL
}

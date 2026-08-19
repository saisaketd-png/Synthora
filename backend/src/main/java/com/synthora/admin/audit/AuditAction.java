package com.synthora.admin.audit;

/**
 * Enumeration of administrative moderation actions recorded in the immutable audit log.
 */
public enum AuditAction {

    // User account administration
    USER_SUSPENDED,
    USER_ACTIVATED,
    USER_ROLE_CHANGED,
    USER_DELETED,

    // Supplier moderation
    SUPPLIER_VERIFIED,
    SUPPLIER_UNVERIFIED,
    SUPPLIER_EXPORT_READY_CHANGED,
    SUPPLIER_SUSPENDED,
    SUPPLIER_ACTIVATED,

    // Product moderation
    PRODUCT_UPDATED,
    PRODUCT_DELETED,

    // Document governance
    DOCUMENT_DELETED,

    // Master Catalog governance
    PRODUCT_REQUEST_APPROVED,
    PRODUCT_REQUEST_REJECTED,
    MASTER_PRODUCT_CREATED,
    MASTER_PRODUCT_UPDATED,
    MASTER_PRODUCT_DEACTIVATED,
    MASTER_PRODUCT_MERGED,

    // Transaction oversight & administration
    RFQ_STATUS_CHANGED,
    ORDER_CANCELLED,
    PO_CONFIRMED,
    PO_PROCESSING_STARTED,
    PO_SHIPPED,
    PO_DELIVERED,
    PO_REJECTED
}

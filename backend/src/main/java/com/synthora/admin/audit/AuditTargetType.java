package com.synthora.admin.audit;

/**
 * Enumeration of entity target types for administrative audit log entries.
 */
public enum AuditTargetType {
    USER,
    SUPPLIER,
    SELLER_PROFILE,
    PRODUCT,
    MASTER_PRODUCT,
    PRODUCT_REQUEST,
    PRODUCT_SUPPLIER,
    SUPPLIER_OFFERING,
    DOCUMENT,
    RFQ,
    PURCHASE_ORDER
}

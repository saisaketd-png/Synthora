package com.kemkendra.admin.audit;

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
    PURCHASE_ORDER,
    ACCOUNT_SUSPENSION,
    ACCOUNT_SUSPENSION_APPEAL,
    PLATFORM_SETTING,
    PLATFORM_FEATURE_FLAG,
    PLATFORM_ANNOUNCEMENT,
    CATALOG_TAXONOMY,
    QUOTATION,
    SHIPMENT
}

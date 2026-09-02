package com.kemkendra.notification;

/**
 * Functional categories for user notifications in KemKendra.
 */
public enum NotificationCategory {
    SECURITY,
    ACCOUNT,
    SUPPLIER_VERIFICATION,
    RFQ,
    QUOTATION,
    PURCHASE_ORDER,
    SHIPMENT,
    CATALOG,
    GOVERNANCE,
    SYSTEM;

    /**
     * Determines whether notifications in this category are mandatory for security/compliance
     * and cannot be disabled by user preferences.
     */
    public boolean isMandatory() {
        return this == SECURITY || this == ACCOUNT;
    }
}

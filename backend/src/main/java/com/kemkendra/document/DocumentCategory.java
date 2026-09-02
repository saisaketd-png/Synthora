package com.kemkendra.document;

public enum DocumentCategory {
    // Technical & Quality
    COA,
    CERTIFICATE_OF_ANALYSIS,
    MSDS,
    SAFETY_DATA_SHEET,
    TECHNICAL_SPECIFICATION,
    TECHNICAL_DATA_SHEET,
    CERTIFICATION,
    QUALITY_CERTIFICATE,
    SAFETY_CERTIFICATE,
    GMP_CERTIFICATE,
    CGMP_CERTIFICATE,
    ISO_CERTIFICATE,
    EXPORT_CERTIFICATE,
    MANUFACTURING_LICENSE,
    REACH_COMPLIANCE,
    HALAL_CERTIFICATE,
    KOSHER_CERTIFICATE,

    // Supplier Compliance
    BUSINESS_REGISTRATION,
    COMPANY_REGISTRATION,
    TAX_REGISTRATION,
    TAX_CERTIFICATE,
    GST_CERTIFICATE,
    PAN_CARD,
    COMPANY_LICENSE,
    BUSINESS_LICENSE,
    DRUG_LICENSE,
    FACTORY_LICENSE,
    POLLUTION_CLEARANCE,
    OTHER_COMPLIANCE,
    OTHER,

    // Commercial & Transaction
    RFQ_ATTACHMENT,
    QUOTATION_ATTACHMENT,
    PURCHASE_ORDER,
    INVOICE,
    COMMERCIAL_INVOICE,
    INVOICE_REFERENCE,
    PACKING_LIST,
    DELIVERY_DOCUMENT,
    DELIVERY_CONFIRMATION,
    RECEIPT_DOCUMENT,
    SHIPPING_DOCUMENT,
    SHIPMENT_DOCUMENT;

    public static DocumentCategory fromString(String value) {
        if (value == null || value.isBlank()) {
            return OTHER;
        }
        String normalized = value.trim().toUpperCase();
        try {
            return DocumentCategory.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return switch (normalized) {
                case "TDS", "TECHNICAL_SPEC", "SPECIFICATION" -> TECHNICAL_DATA_SHEET;
                case "SDS", "SAFETY_SHEET" -> SAFETY_DATA_SHEET;
                case "COA_REPORT", "ANALYSIS_CERTIFICATE" -> CERTIFICATE_OF_ANALYSIS;
                case "GST", "GSTIN" -> GST_CERTIFICATE;
                case "PAN" -> PAN_CARD;
                default -> OTHER;
            };
        }
    }
}

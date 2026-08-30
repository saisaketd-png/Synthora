package com.kemkendra.notification.email;

import com.kemkendra.notification.Notification;
import com.kemkendra.notification.NotificationEntityType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.util.UUID;

/**
 * Resolves subjects, CTA routing, and generates secure HTML email layouts
 * for all 10 supported NotificationType events.
 */
@Component
public class NotificationEmailTemplateResolver {

    private final String appBaseUrl;

    public NotificationEmailTemplateResolver(
            @Value("${kemkendra.app.base-url:http://localhost:3000}") String appBaseUrl) {
        // Strip trailing slash if present for consistent URL construction
        this.appBaseUrl = appBaseUrl != null && appBaseUrl.endsWith("/")
                ? appBaseUrl.substring(0, appBaseUrl.length() - 1)
                : (appBaseUrl != null ? appBaseUrl : "http://localhost:3000");
    }

    public String resolveSubject(Notification notification) {
        String title = notification.getTitle() != null ? notification.getTitle() : "New Notification";
        return "[KemKendra] " + title;
    }

    public String resolveCtaUrl(Notification notification) {
        NotificationEntityType entityType = notification.getEntityType();
        UUID entityId = notification.getEntityId();

        if (entityType == null || entityId == null) {
            return appBaseUrl + "/dashboard";
        }

        return switch (entityType) {
            case RFQ -> appBaseUrl + "/dashboard/rfqs/" + entityId;
            case QUOTATION -> appBaseUrl + "/dashboard/rfqs/" + entityId;
            case PURCHASE_ORDER -> appBaseUrl + "/dashboard/orders/" + entityId;
            case SHIPMENT -> appBaseUrl + "/dashboard/orders/" + entityId;
            case DOCUMENT -> appBaseUrl + "/dashboard/documents";
            case PRODUCT_REQUEST -> appBaseUrl + "/dashboard/supplier/products";
            case MASTER_PRODUCT -> appBaseUrl + "/products/" + entityId;
            case SUPPLIER_OFFERING -> appBaseUrl + "/dashboard/admin/catalog/offerings/" + entityId;
            case SUPPLIER -> appBaseUrl + "/dashboard/admin/catalog/verification/" + entityId;
            case ACCOUNT_SUSPENSION, ACCOUNT_SUSPENSION_APPEAL -> appBaseUrl + "/dashboard/account-review";
        };
    }

    public String resolveCtaText(Notification notification) {
        NotificationEntityType entityType = notification.getEntityType();
        if (entityType == null) {
            return "View in KemKendra";
        }

        return switch (entityType) {
            case RFQ -> "View RFQ";
            case QUOTATION -> "View Quotation";
            case PURCHASE_ORDER -> "View Purchase Order";
            case SHIPMENT -> "Track Shipment";
            case DOCUMENT -> "View Document";
            case PRODUCT_REQUEST -> "View Request Status";
            case MASTER_PRODUCT -> "View Master Product";
            case SUPPLIER_OFFERING -> "View Supplier Offering";
            case SUPPLIER -> "View Supplier Profile";
            case ACCOUNT_SUSPENSION -> "Review Account Status";
            case ACCOUNT_SUSPENSION_APPEAL -> "View Appeal Status";
        };
    }

    /**
     * Builds a responsive, professional HTML email layout with HTML-escaped content.
     */
    public String buildHtmlBody(Notification notification) {
        String safeTitle = HtmlUtils.htmlEscape(notification.getTitle() != null ? notification.getTitle() : "Notification");
        String safeMessage = HtmlUtils.htmlEscape(notification.getMessage() != null ? notification.getMessage() : "");
        String ctaUrl = resolveCtaUrl(notification);
        String ctaText = resolveCtaText(notification);

        return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            background-color: #f4f6f8;
                            margin: 0;
                            padding: 0;
                            -webkit-font-smoothing: antialiased;
                        }
                        .wrapper {
                            max-width: 600px;
                            margin: 30px auto;
                            background: #ffffff;
                            border-radius: 8px;
                            overflow: hidden;
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                            border: 1px solid #e2e8f0;
                        }
                        .header {
                            background-color: #0f172a;
                            padding: 24px 32px;
                            text-align: left;
                        }
                        .brand {
                            font-size: 20px;
                            font-weight: 700;
                            color: #ffffff;
                            letter-spacing: 0.5px;
                            text-decoration: none;
                        }
                        .brand-sub {
                            font-size: 11px;
                            color: #94a3b8;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            display: block;
                            margin-top: 2px;
                        }
                        .content {
                            padding: 32px;
                            color: #1e293b;
                        }
                        .title {
                            font-size: 18px;
                            font-weight: 600;
                            color: #0f172a;
                            margin: 0 0 16px 0;
                        }
                        .message-box {
                            background-color: #f8fafc;
                            border-left: 4px solid #2563eb;
                            padding: 16px 20px;
                            border-radius: 4px;
                            margin-bottom: 24px;
                            color: #334155;
                            font-size: 15px;
                            line-height: 1.6;
                        }
                        .cta-container {
                            margin: 28px 0 12px 0;
                        }
                        .cta-button {
                            display: inline-block;
                            background-color: #2563eb;
                            color: #ffffff !important;
                            font-size: 14px;
                            font-weight: 600;
                            text-decoration: none;
                            padding: 12px 28px;
                            border-radius: 6px;
                        }
                        .footer {
                            background-color: #f8fafc;
                            padding: 20px 32px;
                            border-top: 1px solid #e2e8f0;
                            color: #64748b;
                            font-size: 12px;
                            line-height: 1.5;
                            text-align: center;
                        }
                    </style>
                </head>
                <body>
                    <div class="wrapper">
                        <div class="header">
                            <span class="brand">KEMKENDRA</span>
                            <span class="brand-sub">B2B Chemical & Raw Materials Marketplace</span>
                        </div>
                        <div class="content">
                            <h2 class="title">%s</h2>
                            <div class="message-box">
                                %s
                            </div>
                            <div class="cta-container">
                                <a href="%s" class="cta-button">%s</a>
                            </div>
                        </div>
                        <div class="footer">
                            <p style="margin: 0 0 4px 0;">This is an automated notification from KemKendra Chemical Marketplace.</p>
                            <p style="margin: 0;">Please log in to your account dashboard to manage orders and communications.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(safeTitle, safeTitle, safeMessage, ctaUrl, ctaText);
    }
}

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
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <title>%s</title>
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
                    <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 48px 16px;">
                        <tr>
                            <td align="center">
                                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); overflow: hidden;">
                                    <!-- Minimal Header -->
                                    <tr>
                                        <td style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #f1f5f9;">
                                            <table width="100%%" border="0" cellspacing="0" cellpadding="0">
                                                <tr>
                                                    <td>
                                                        <span style="font-size: 16px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">KEMKENDRA</span>
                                                        <span style="display: inline-block; margin-left: 8px; font-size: 13px; color: #94a3b8; font-weight: 400;">&bull;&nbsp; Commercial Portal</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Editorial Content -->
                                    <tr>
                                        <td style="padding: 36px 40px 32px 40px;">
                                            <h1 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 600; color: #0f172a; letter-spacing: -0.2px; line-height: 28px;">
                                                %s
                                            </h1>
                                            <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 24px; color: #334155;">
                                                %s
                                            </p>
                                            <!-- Action Button -->
                                            <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 28px 0;">
                                                <tr>
                                                    <td align="center" style="border-radius: 6px; background-color: #0f172a;">
                                                        <a href="%s" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #0f172a;">
                                                            %s
                                                        </a>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <!-- Understated Footer -->
                                    <tr>
                                        <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f1f5f9;">
                                            <p style="margin: 0 0 4px 0; font-size: 12px; line-height: 18px; color: #64748b;">
                                                This is an operational transaction message regarding your KemKendra marketplace account.
                                            </p>
                                            <p style="margin: 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                                                &copy; %d KemKendra Inc. Enterprise B2B Chemical Commerce.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """.formatted(safeTitle, safeTitle, safeMessage, ctaUrl, ctaText, java.time.Year.now().getValue());
    }
}

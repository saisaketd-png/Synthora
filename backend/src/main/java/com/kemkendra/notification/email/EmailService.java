package com.kemkendra.notification.email;

/**
 * Service abstraction for sending emails.
 */
public interface EmailService {

    /**
     * Sends an HTML email to the specified recipient address.
     * Implementations must isolate errors and not rethrow exceptions.
     *
     * @param to recipient email address
     * @param subject email subject line
     * @param htmlBody HTML email body content
     */
    void sendHtmlEmail(String to, String subject, String htmlBody);
}

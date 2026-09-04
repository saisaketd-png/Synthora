package com.kemkendra.notification.email;

/**
 * Service abstraction for sending emails.
 */
public interface EmailService {

    /**
     * Sends an HTML email synchronously. Blocks until SMTP delivers or fails.
     *
     * @param to recipient email address
     * @param subject email subject line
     * @param htmlBody HTML email body content
     */
    void sendHtmlEmail(String to, String subject, String htmlBody);

    /**
     * Sends an HTML email asynchronously on the emailTaskExecutor thread pool.
     * Does not block the calling thread. Use this for transactional emails triggered
     * during HTTP requests (e.g. registration, password reset) to avoid SMTP blocking.
     *
     * @param to recipient email address
     * @param subject email subject line
     * @param htmlBody HTML email body content
     */
    void sendHtmlEmailAsync(String to, String subject, String htmlBody);
}

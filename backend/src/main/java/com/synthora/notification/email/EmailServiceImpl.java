package com.synthora.notification.email;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Production implementation of EmailService using Spring JavaMailSender.
 * Isolates all SMTP/MIME delivery failures from business execution.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;
    private final boolean mailEnabled;

    public EmailServiceImpl(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${synthora.mail.from:notifications@kemkendra.com}") String fromAddress,
            @Value("${synthora.mail.from-name:KemKendra Chemical Marketplace}") String fromName,
            @Value("${synthora.mail.enabled:true}") boolean mailEnabled) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.mailEnabled = mailEnabled;
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.debug("Email sending is disabled. Skipping email to {} with subject '{}'", to, subject);
            return;
        }

        if (to == null || to.isBlank()) {
            log.warn("Cannot send email: recipient address is null or blank");
            return;
        }

        if (mailSender == null) {
            log.warn("JavaMailSender is not configured. Skipping email to {}", to);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(new InternetAddress(fromAddress, fromName, StandardCharsets.UTF_8.name()));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
            log.info("Successfully dispatched notification email to {} with subject '{}'", to, subject);
        } catch (Exception e) {
            log.error("Failed to send notification email to {} with subject '{}': {}", to, subject, e.getMessage(), e);
        }
    }
}

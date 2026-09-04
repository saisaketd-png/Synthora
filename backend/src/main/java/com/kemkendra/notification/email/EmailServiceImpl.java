package com.kemkendra.notification.email;

import jakarta.annotation.PostConstruct;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Production implementation of EmailService using Spring JavaMailSender.
 *
 * sendHtmlEmailAsync delegates to AsyncEmailDispatcher — a separate Spring bean —
 * so that @Async AOP proxy intercepts correctly. Direct self-calls (this.method())
 * bypass the proxy and @Async would silently run synchronously.
 */
@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String fromName;
    private final boolean mailEnabled;

    // @Lazy to break the circular dependency: AsyncEmailDispatcher → EmailService → EmailServiceImpl → AsyncEmailDispatcher
    @Lazy
    @Autowired
    private AsyncEmailDispatcher asyncEmailDispatcher;

    public EmailServiceImpl(
            @Autowired(required = false) JavaMailSender mailSender,
            @Value("${kemkendra.mail.from:notifications@kemkendra.com}") String fromAddress,
            @Value("${kemkendra.mail.from-name:KemKendra Chemical Marketplace}") String fromName,
            @Value("${kemkendra.mail.enabled:true}") boolean mailEnabled) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.fromName = fromName;
        this.mailEnabled = mailEnabled;
    }

    @PostConstruct
    void logSmtpConfig() {
        if (mailSender instanceof JavaMailSenderImpl impl) {
            log.info("[SMTP-DIAG] host={} port={} username={} passwordLen={} mailEnabled={}",
                    impl.getHost(), impl.getPort(), impl.getUsername(),
                    impl.getPassword() != null ? impl.getPassword().length() : 0,
                    mailEnabled);
        } else {
            log.warn("[SMTP-DIAG] JavaMailSender is not JavaMailSenderImpl — type: {}",
                    mailSender != null ? mailSender.getClass().getName() : "null");
        }
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
            log.info("Successfully dispatched email to {} — subject '{}'", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {} — subject '{}': {}", to, subject, e.getMessage());
        }
    }

    /**
     * Fires email asynchronously via AsyncEmailDispatcher.
     * Must delegate to a separate Spring bean — NOT call this.sendHtmlEmail() —
     * because self-calls bypass the Spring AOP proxy and @Async silently does nothing.
     */
    @Override
    public void sendHtmlEmailAsync(String to, String subject, String htmlBody) {
        asyncEmailDispatcher.dispatch(to, subject, htmlBody);
    }
}

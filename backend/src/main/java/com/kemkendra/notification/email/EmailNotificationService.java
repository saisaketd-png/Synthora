package com.kemkendra.notification.email;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.notification.Notification;
import com.kemkendra.notification.NotificationCategory;
import com.kemkendra.notification.preference.NotificationPreferenceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Service responsible for asynchronous dispatch of notification emails.
 * Failure in email resolution or delivery is isolated and will not impact
 * the caller or the persisted in-app notification.
 */
@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationEmailTemplateResolver templateResolver;
    private final NotificationPreferenceService preferenceService;

    public EmailNotificationService(
            UserRepository userRepository,
            EmailService emailService,
            NotificationEmailTemplateResolver templateResolver) {
        this(userRepository, emailService, templateResolver, null);
    }

    @Autowired
    public EmailNotificationService(
            UserRepository userRepository,
            EmailService emailService,
            NotificationEmailTemplateResolver templateResolver,
            NotificationPreferenceService preferenceService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.templateResolver = templateResolver;
        this.preferenceService = preferenceService;
    }

    /**
     * Asynchronously sends an email notification for a persisted Notification record.
     * Respects user notification preferences for non-mandatory categories.
     */
    @Async("emailTaskExecutor")
    public void sendNotificationEmail(Notification notification) {
        if (notification == null) {
            log.warn("Cannot send email: notification is null");
            return;
        }

        UUID recipientId = notification.getRecipientId();
        if (recipientId == null) {
            log.warn("Cannot send email: notification {} has null recipientId", notification.getId());
            return;
        }

        NotificationCategory category = notification.getCategory() != null
                ? notification.getCategory()
                : Notification.deriveCategoryFromType(notification.getType());

        if (preferenceService != null && !preferenceService.isEmailEnabled(recipientId, category)) {
            log.debug("Email notification suppressed by user preference for recipient {} category {}", recipientId, category);
            return;
        }

        try {
            User recipient = userRepository.findById(recipientId).orElse(null);
            if (recipient == null) {
                log.warn("Cannot send email for notification {}: recipient user {} not found in database",
                        notification.getId(), recipientId);
                return;
            }

            String recipientEmail = recipient.getEmail();
            if (recipientEmail == null || recipientEmail.isBlank()) {
                log.warn("Cannot send email for notification {}: user {} has no email address",
                        notification.getId(), recipientId);
                return;
            }

            String subject = templateResolver.resolveSubject(notification);
            String htmlBody = templateResolver.buildHtmlBody(notification);

            emailService.sendHtmlEmail(recipientEmail, subject, htmlBody);
        } catch (Exception e) {
            log.error("Unexpected error in async email dispatch for notification {}: {}",
                    notification.getId(), e.getMessage(), e);
        }
    }
}

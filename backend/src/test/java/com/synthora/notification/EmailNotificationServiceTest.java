package com.synthora.notification;

import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.notification.email.EmailNotificationService;
import com.synthora.notification.email.EmailService;
import com.synthora.notification.email.EmailServiceImpl;
import com.synthora.notification.email.NotificationEmailTemplateResolver;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;

import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class EmailNotificationServiceTest {

    @Autowired private UserRepository userRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User recipient;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        recipient = new User();
        recipient.setEmail("procurement-officer@enterprise.com");
        recipient.setName("Procurement Officer");
        recipient.setPasswordHash("hash");
        recipient.setRole(UserRole.USER);
        recipient = userRepository.save(recipient);
    }

    // -------------------------------------------------------------
    // TEMPLATE RESOLVER TESTS
    // -------------------------------------------------------------

    @Test
    public void testTemplateResolver_AllNotificationTypes_GenerateValidSubjectsAndCtas() {
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("https://marketplace.synthora.com");

        for (NotificationType type : NotificationType.values()) {
            Notification n = new Notification();
            n.setType(type);
            n.setTitle("Test Title for " + type.name());
            n.setMessage("Test message body for " + type.name());
            n.setRecipientId(recipient.getId());
            n.setEntityType(NotificationEntityType.PURCHASE_ORDER);
            UUID entityId = UUID.randomUUID();
            n.setEntityId(entityId);

            String subject = resolver.resolveSubject(n);
            assertNotNull(subject);
            assertTrue(subject.startsWith("[KemKendra] "));

            String ctaUrl = resolver.resolveCtaUrl(n);
            assertNotNull(ctaUrl);
            assertTrue(ctaUrl.startsWith("https://marketplace.synthora.com/dashboard/orders/"));

            String ctaText = resolver.resolveCtaText(n);
            assertNotNull(ctaText);

            String html = resolver.buildHtmlBody(n);
            assertNotNull(html);
            assertTrue(html.contains("KEMKENDRA"));
            assertTrue(html.contains(ctaUrl));
            assertTrue(html.contains(ctaText));
        }
    }

    @Test
    public void testTemplateResolver_HtmlEscapesUserContent_PreventingXss() {
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("https://marketplace.synthora.com");

        Notification n = new Notification();
        n.setType(NotificationType.RFQ_SUBMITTED);
        n.setTitle("<script>alert('xss')</script> Chemical Order");
        n.setMessage("Please review <img src=x onerror=alert('xss')> & urgent requirements <test>");
        n.setRecipientId(recipient.getId());
        n.setEntityType(NotificationEntityType.RFQ);
        n.setEntityId(UUID.randomUUID());

        String html = resolver.buildHtmlBody(n);
        assertFalse(html.contains("<script>"));
        assertFalse(html.contains("<img src=x"));
        assertTrue(html.contains("&lt;script&gt;"));
        assertTrue(html.contains("&lt;img src=x"));
    }

    @Test
    public void testTemplateResolver_CtaUrlCannotBeRedirectedToExternalDomain() {
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("https://app.synthora.com");

        UUID entityId = UUID.randomUUID();
        Notification n = new Notification();
        n.setType(NotificationType.RFQ_SUBMITTED);
        n.setTitle("RFQ");
        n.setEntityType(NotificationEntityType.RFQ);
        n.setEntityId(entityId);

        String ctaUrl = resolver.resolveCtaUrl(n);
        assertEquals("https://app.synthora.com/dashboard/rfqs/" + entityId, ctaUrl);
        assertTrue(ctaUrl.startsWith("https://app.synthora.com/"));
    }

    // -------------------------------------------------------------
    // EMAIL SERVICE IMPL TESTS
    // -------------------------------------------------------------

    @Test
    public void testEmailServiceImpl_SuccessfulSend() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);

        EmailServiceImpl emailService = new EmailServiceImpl(
                mailSender,
                "notifications@synthora.com",
                "Synthora B2B Marketplace",
                true
        );

        emailService.sendHtmlEmail("buyer@example.com", "Test Subject", "<p>Hello</p>");

        verify(mailSender, times(1)).send(any(MimeMessage.class));
    }

    @Test
    public void testEmailServiceImpl_WhenDisabled_DoesNotSend() {
        JavaMailSender mailSender = mock(JavaMailSender.class);

        EmailServiceImpl emailService = new EmailServiceImpl(
                mailSender,
                "notifications@synthora.com",
                "Synthora B2B Marketplace",
                false // disabled
        );

        emailService.sendHtmlEmail("buyer@example.com", "Test Subject", "<p>Hello</p>");

        verify(mailSender, never()).send(any(MimeMessage.class));
    }

    @Test
    public void testEmailServiceImpl_MailSenderExceptionIsCaughtAndIsolated() {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        MimeMessage mimeMessage = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        doThrow(new MailSendException("SMTP connection refused")).when(mailSender).send(any(MimeMessage.class));

        EmailServiceImpl emailService = new EmailServiceImpl(
                mailSender,
                "notifications@synthora.com",
                "Synthora B2B Marketplace",
                true
        );

        // Must NOT throw exception
        assertDoesNotThrow(() -> {
            emailService.sendHtmlEmail("buyer@example.com", "Test Subject", "<p>Hello</p>");
        });
    }

    // -------------------------------------------------------------
    // EMAIL NOTIFICATION SERVICE ORCHESTRATION TESTS
    // -------------------------------------------------------------

    @Test
    public void testEmailNotificationService_ResolvesRecipientEmailAndDispatches() {
        EmailService mockEmailService = mock(EmailService.class);
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("http://localhost:3000");

        EmailNotificationService service = new EmailNotificationService(
                userRepository,
                mockEmailService,
                resolver
        );

        Notification n = new Notification();
        n.setType(NotificationType.PO_ISSUED);
        n.setTitle("Purchase Order Issued");
        n.setMessage("PO-2026-0001 has been issued to you");
        n.setRecipientId(recipient.getId());
        n.setEntityType(NotificationEntityType.PURCHASE_ORDER);
        n.setEntityId(UUID.randomUUID());

        service.sendNotificationEmail(n);

        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> subjectCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> bodyCaptor = ArgumentCaptor.forClass(String.class);

        verify(mockEmailService, times(1)).sendHtmlEmail(emailCaptor.capture(), subjectCaptor.capture(), bodyCaptor.capture());

        assertEquals("procurement-officer@enterprise.com", emailCaptor.getValue());
        assertEquals("[KemKendra] Purchase Order Issued", subjectCaptor.getValue());
        assertTrue(bodyCaptor.getValue().contains("PO-2026-0001"));
    }

    @Test
    public void testEmailNotificationService_MissingRecipientUser_SafelyHandledWithoutThrowing() {
        EmailService mockEmailService = mock(EmailService.class);
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("http://localhost:3000");

        EmailNotificationService service = new EmailNotificationService(
                userRepository,
                mockEmailService,
                resolver
        );

        Notification n = new Notification();
        n.setType(NotificationType.PO_ISSUED);
        n.setTitle("Purchase Order Issued");
        n.setMessage("Message");
        n.setRecipientId(UUID.randomUUID()); // Non-existent user

        assertDoesNotThrow(() -> {
            service.sendNotificationEmail(n);
        });

        verify(mockEmailService, never()).sendHtmlEmail(any(), any(), any());
    }

    @Test
    public void testEmailNotificationService_NullNotification_SafelyHandled() {
        EmailService mockEmailService = mock(EmailService.class);
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("http://localhost:3000");

        EmailNotificationService service = new EmailNotificationService(
                userRepository,
                mockEmailService,
                resolver
        );

        assertDoesNotThrow(() -> {
            service.sendNotificationEmail(null);
        });

        verify(mockEmailService, never()).sendHtmlEmail(any(), any(), any());
    }
}

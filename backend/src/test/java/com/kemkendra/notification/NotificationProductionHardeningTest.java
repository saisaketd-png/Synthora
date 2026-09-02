package com.kemkendra.notification;

import com.kemkendra.common.ResourceNotFoundException;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.notification.dto.NotificationResponse;
import com.kemkendra.notification.email.EmailService;
import com.kemkendra.notification.email.NotificationEmailTemplateResolver;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class NotificationProductionHardeningTest {

    @MockBean private EmailService emailService;

    @Autowired private NotificationService notificationService;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User userA;
    private User userB;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM user_notification_preferences; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        userA = new User();
        userA.setEmail("buyer-a@enterprise.com");
        userA.setName("Buyer Alpha");
        userA.setPasswordHash("hash");
        userA.setRole(UserRole.USER);
        userA = userRepository.save(userA);

        userB = new User();
        userB.setEmail("buyer-b@corp.com");
        userB.setName("Buyer Beta");
        userB.setPasswordHash("hash");
        userB.setRole(UserRole.USER);
        userB = userRepository.save(userB);
    }

    // -------------------------------------------------------------
    // 1. IDOR & RECIPIENT SECURITY
    // -------------------------------------------------------------

    @Test
    public void testIdor_UserACannotReadOrMarkUserBNotification() {
        Notification notifB = notificationService.createNotification(
                userB.getId(),
                NotificationType.RFQ_SUBMITTED,
                "RFQ for B",
                "Message for B",
                NotificationEntityType.RFQ,
                UUID.randomUUID()
        );

        // User A query must NOT return User B's notification
        Page<NotificationResponse> userANotifs = notificationService.getNotifications(userA.getId(), PageRequest.of(0, 10));
        assertEquals(0, userANotifs.getTotalElements());

        // User A cannot retrieve User B's unread count
        assertEquals(0, notificationService.getUnreadCount(userA.getId()));
        assertEquals(1, notificationService.getUnreadCount(userB.getId()));

        // User A cannot mark User B's notification as read
        assertThrows(ResourceNotFoundException.class, () -> {
            notificationService.markAsRead(notifB.getId(), userA.getId());
        });

        // User B's notification remains unread
        Notification refreshed = notificationRepository.findById(notifB.getId()).orElseThrow();
        assertFalse(refreshed.isRead());
    }

    @Test
    public void testIdor_MarkAllOnlyAffectsAuthenticatedUser() {
        notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "A1", "Msg A1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "A2", "Msg A2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());
        notificationService.createNotification(userB.getId(), NotificationType.QUOTATION_SUBMITTED, "B1", "Msg B1", NotificationEntityType.QUOTATION, UUID.randomUUID());

        assertEquals(2, notificationService.getUnreadCount(userA.getId()));
        assertEquals(1, notificationService.getUnreadCount(userB.getId()));

        // User A marks all as read
        int updated = notificationService.markAllAsRead(userA.getId());
        assertEquals(2, updated);

        // User A unread is 0, User B unread is STILL 1
        assertEquals(0, notificationService.getUnreadCount(userA.getId()));
        assertEquals(1, notificationService.getUnreadCount(userB.getId()));
    }

    // -------------------------------------------------------------
    // 2. MARK AS READ IDEMPOTENCY & STATE INTEGRITY
    // -------------------------------------------------------------

    @Test
    public void testMarkAsRead_Idempotent_PreservesOriginalReadAt() throws InterruptedException {
        Notification notif = notificationService.createNotification(
                userA.getId(),
                NotificationType.PO_CONFIRMED,
                "PO Confirmed",
                "PO Confirmed",
                NotificationEntityType.PURCHASE_ORDER,
                UUID.randomUUID()
        );

        NotificationResponse resp1 = notificationService.markAsRead(notif.getId(), userA.getId());
        assertTrue(resp1.read());
        assertNotNull(resp1.readAt());
        LocalDateTime initialReadAt = resp1.readAt();

        Thread.sleep(100);

        // Mark as read again
        NotificationResponse resp2 = notificationService.markAsRead(notif.getId(), userA.getId());
        assertTrue(resp2.read());
        assertEquals(
                initialReadAt.truncatedTo(java.time.temporal.ChronoUnit.SECONDS),
                resp2.readAt().truncatedTo(java.time.temporal.ChronoUnit.SECONDS),
                "Original readAt timestamp must not be overwritten"
        );
    }

    // -------------------------------------------------------------
    // 3. PAGINATION BOUNDS & DOS PROTECTION
    // -------------------------------------------------------------

    @Test
    public void testPagination_ClampsLargePageSize() {
        for (int i = 0; i < 10; i++) {
            notificationService.createNotification(
                    userA.getId(),
                    NotificationType.DOCUMENT_UPLOADED,
                    "Doc " + i,
                    "Msg " + i,
                    NotificationEntityType.DOCUMENT,
                    UUID.randomUUID()
            );
        }

        // Requesting page size 1000 must be bounded to 100
        Page<NotificationResponse> page = notificationService.getNotifications(userA.getId(), PageRequest.of(0, 1000));
        assertEquals(10, page.getTotalElements());
        assertEquals(100, page.getSize());
    }

    @Test
    public void testPagination_DefaultDescendingSort() throws Exception {
        Notification n1 = notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "First", "M1", NotificationEntityType.RFQ, UUID.randomUUID());
        Thread.sleep(10);
        Notification n2 = notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "Second", "M2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        Page<NotificationResponse> page = notificationService.getNotifications(userA.getId(), PageRequest.of(0, 10, Sort.unsorted()));
        assertEquals(2, page.getContent().size());
        assertEquals(n2.getId(), page.getContent().get(0).id(), "Newest notification must be first");
        assertEquals(n1.getId(), page.getContent().get(1).id());
    }

    // -------------------------------------------------------------
    // 4. HTML ESCAPING & TEMPLATE SECURITY
    // -------------------------------------------------------------

    @Test
    public void testTemplateSecurity_EscapesMaliciousPayloads() {
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("https://app.kemkendra.com");

        Notification evil = new Notification();
        evil.setType(NotificationType.RFQ_SUBMITTED);
        evil.setTitle("<script>alert('pwned')</script> Injection");
        evil.setMessage("Hello <iframe src='http://evil.com'></iframe> & <style>body{display:none}</style>");
        evil.setEntityType(NotificationEntityType.RFQ);
        evil.setEntityId(UUID.randomUUID());

        String html = resolver.buildHtmlBody(evil);

        assertFalse(html.contains("<script>"));
        assertFalse(html.contains("<iframe"));
        assertFalse(html.contains("<style>body"));
        assertTrue(html.contains("&lt;script&gt;"));
        assertTrue(html.contains("&lt;iframe"));
        assertTrue(html.contains("https://app.kemkendra.com/dashboard/rfqs/"));
    }

    @Test
    public void testTemplateSecurity_NoSensitiveDataLeaks() {
        NotificationEmailTemplateResolver resolver = new NotificationEmailTemplateResolver("https://app.kemkendra.com");

        Notification n = new Notification();
        n.setType(NotificationType.PO_ISSUED);
        n.setTitle("Purchase Order PO-101");
        n.setMessage("PO has been issued");
        n.setRecipientId(userA.getId());
        n.setEntityType(NotificationEntityType.PURCHASE_ORDER);
        n.setEntityId(UUID.randomUUID());

        String html = resolver.buildHtmlBody(n);

        // Verify recipient UUID, password hash, JWT, etc. are NOT in email body
        assertFalse(html.contains(userA.getId().toString()));
        assertFalse(html.contains("passwordHash"));
        assertFalse(html.contains("Bearer"));
    }
}

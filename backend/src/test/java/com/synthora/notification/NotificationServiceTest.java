package com.synthora.notification;

import com.synthora.common.ResourceNotFoundException;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.notification.dto.NotificationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class NotificationServiceTest {

    @Autowired private NotificationService notificationService;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

    private User userA;
    private User userB;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute(
                "UPDATE rfqs SET accepted_quotation_id = NULL; " +
                "DELETE FROM shipments; " +
                "DELETE FROM purchase_orders; " +
                "DELETE FROM quotations; " +
                "DELETE FROM rfqs; " +
                "DELETE FROM documents; " +
                "DELETE FROM product_suppliers; " +
                "DELETE FROM products; " +
                "DELETE FROM seller_profiles; " +
                "DELETE FROM suppliers; " +
                "DELETE FROM users;"
        );

        userA = new User();
        userA.setEmail("usera@synthora.com");
        userA.setName("User A");
        userA.setPasswordHash("hash");
        userA.setRole(UserRole.USER);
        userA = userRepository.save(userA);

        userB = new User();
        userB.setEmail("userb@synthora.com");
        userB.setName("User B");
        userB.setPasswordHash("hash");
        userB.setRole(UserRole.SUPPLIER);
        userB = userRepository.save(userB);
    }

    @Test
    public void testCreateNotification_Success() {
        UUID entityId = UUID.randomUUID();
        Notification n = notificationService.createNotification(
                userA.getId(),
                NotificationType.RFQ_SUBMITTED,
                "New RFQ Received",
                "A buyer submitted an RFQ",
                NotificationEntityType.RFQ,
                entityId
        );

        assertNotNull(n);
        assertNotNull(n.getId());
        assertEquals(userA.getId(), n.getRecipientId());
        assertEquals(NotificationType.RFQ_SUBMITTED, n.getType());
        assertEquals("New RFQ Received", n.getTitle());
        assertEquals("A buyer submitted an RFQ", n.getMessage());
        assertEquals(NotificationEntityType.RFQ, n.getEntityType());
        assertEquals(entityId, n.getEntityId());
        assertFalse(n.isRead());
        assertNull(n.getReadAt());
        assertNotNull(n.getCreatedAt());
    }

    @Test
    public void testCreateNotification_NullRecipientReturnsNull() {
        Notification n = notificationService.createNotification(
                null,
                NotificationType.PO_ISSUED,
                "Title",
                "Msg",
                NotificationEntityType.PURCHASE_ORDER,
                UUID.randomUUID()
        );
        assertNull(n);
    }

    @Test
    public void testGetNotifications_ScopedToRecipient() {
        notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "Title 1", "Msg 1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "Title 2", "Msg 2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());
        notificationService.createNotification(userB.getId(), NotificationType.PO_CONFIRMED, "Title 3", "Msg 3", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        Page<NotificationResponse> pageA = notificationService.getNotifications(userA.getId(), PageRequest.of(0, 10));
        assertEquals(2, pageA.getTotalElements());

        Page<NotificationResponse> pageB = notificationService.getNotifications(userB.getId(), PageRequest.of(0, 10));
        assertEquals(1, pageB.getTotalElements());
    }

    @Test
    public void testGetUnreadCount() {
        assertEquals(0, notificationService.getUnreadCount(userA.getId()));

        Notification n1 = notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "T1", "M1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "T2", "M2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        assertEquals(2, notificationService.getUnreadCount(userA.getId()));

        notificationService.markAsRead(n1.getId(), userA.getId());
        assertEquals(1, notificationService.getUnreadCount(userA.getId()));
    }

    @Test
    public void testMarkAsRead_Success() {
        Notification n = notificationService.createNotification(userA.getId(), NotificationType.QUOTATION_SUBMITTED, "T", "M", NotificationEntityType.QUOTATION, UUID.randomUUID());
        assertFalse(n.isRead());

        NotificationResponse response = notificationService.markAsRead(n.getId(), userA.getId());
        assertTrue(response.read());
        assertNotNull(response.readAt());

        Notification reloaded = notificationRepository.findById(n.getId()).orElseThrow();
        assertTrue(reloaded.isRead());
        assertNotNull(reloaded.getReadAt());
    }

    @Test
    public void testMarkAsRead_OtherUserCannotAccess_Throws404() {
        Notification n = notificationService.createNotification(userA.getId(), NotificationType.QUOTATION_SUBMITTED, "T", "M", NotificationEntityType.QUOTATION, UUID.randomUUID());

        assertThrows(ResourceNotFoundException.class, () -> {
            notificationService.markAsRead(n.getId(), userB.getId());
        });
    }

    @Test
    public void testMarkAsRead_NonExistent_Throws404() {
        assertThrows(ResourceNotFoundException.class, () -> {
            notificationService.markAsRead(UUID.randomUUID(), userA.getId());
        });
    }

    @Test
    public void testMarkAllAsRead() {
        notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "T1", "M1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "T2", "M2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());
        notificationService.createNotification(userB.getId(), NotificationType.PO_CONFIRMED, "T3", "M3", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        int countA = notificationService.markAllAsRead(userA.getId());
        assertEquals(2, countA);
        assertEquals(0, notificationService.getUnreadCount(userA.getId()));

        // User B's unread count should remain 1
        assertEquals(1, notificationService.getUnreadCount(userB.getId()));
    }
}

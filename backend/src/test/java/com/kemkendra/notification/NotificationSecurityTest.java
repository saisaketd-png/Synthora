package com.kemkendra.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.notification.preference.dto.NotificationPreferenceDtos.*;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class NotificationSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private NotificationService notificationService;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;

    private User buyer;
    private User supplier;
    private User admin;
    private User suspendedUser;

    private String buyerToken;
    private String supplierToken;
    private String adminToken;
    private String suspendedToken;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM user_notification_preferences; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        buyer = new User();
        buyer.setEmail("buyer@kemkendra.com");
        buyer.setName("Enterprise Buyer");
        buyer.setPasswordHash("hash123");
        buyer.setRole(UserRole.USER);
        buyer.setStatus(UserStatus.ACTIVE);
        buyer = userRepository.save(buyer);
        buyerToken = "Bearer " + jwtService.generateToken(buyer);

        supplier = new User();
        supplier.setEmail("supplier@kemkendra.com");
        supplier.setName("Chemical Supplier");
        supplier.setPasswordHash("hash123");
        supplier.setRole(UserRole.SUPPLIER);
        supplier.setStatus(UserStatus.ACTIVE);
        supplier = userRepository.save(supplier);
        supplierToken = "Bearer " + jwtService.generateToken(supplier);

        admin = new User();
        admin.setEmail("admin@kemkendra.com");
        admin.setName("Admin Operations");
        admin.setPasswordHash("hash123");
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin = userRepository.save(admin);
        adminToken = "Bearer " + jwtService.generateToken(admin);

        suspendedUser = new User();
        suspendedUser.setEmail("suspended@kemkendra.com");
        suspendedUser.setName("Suspended Account");
        suspendedUser.setPasswordHash("hash123");
        suspendedUser.setRole(UserRole.USER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser = userRepository.save(suspendedUser);
        suspendedToken = "Bearer " + jwtService.generateToken(suspendedUser);
    }

    @Test
    @DisplayName("1. Unauthenticated notification access returns 401 Unauthorized")
    public void testUnauthenticatedAccess_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/users/me/notification-preferences"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("2. Buyer can access their own notifications")
    public void testBuyerAccessOwnNotifications_Returns200() throws Exception {
        notificationService.createNotification(
                buyer.getId(),
                NotificationType.QUOTATION_SUBMITTED,
                "New Quotation",
                "Quotation received for RFQ",
                NotificationEntityType.QUOTATION,
                UUID.randomUUID()
        );

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("New Quotation"))
                .andExpect(jsonPath("$.content[0].category").value("QUOTATION"))
                .andExpect(jsonPath("$.content[0].priority").value("NORMAL"));
    }

    @Test
    @DisplayName("3. Supplier can access their own notifications")
    public void testSupplierAccessOwnNotifications_Returns200() throws Exception {
        notificationService.createNotification(
                supplier.getId(),
                NotificationType.RFQ_SUBMITTED,
                "New RFQ",
                "RFQ submitted by buyer",
                NotificationEntityType.RFQ,
                UUID.randomUUID()
        );

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title").value("New RFQ"))
                .andExpect(jsonPath("$.content[0].category").value("RFQ"));
    }

    @Test
    @DisplayName("4. IDOR Protection: User cannot access or infer another user's notifications")
    public void testIdorProtection_UserCannotReadOthersNotifications() throws Exception {
        Notification buyerNotif = notificationService.createNotification(
                buyer.getId(),
                NotificationType.QUOTATION_SUBMITTED,
                "Confidential Buyer Quote",
                "Message for buyer only",
                NotificationEntityType.QUOTATION,
                UUID.randomUUID()
        );

        // Supplier queries notifications — must be empty for supplier
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", supplierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(0)))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    @DisplayName("5. IDOR Protection: User cannot mark another user's notification as read")
    public void testIdorProtection_UserCannotMarkOthersNotificationAsRead() throws Exception {
        Notification buyerNotif = notificationService.createNotification(
                buyer.getId(),
                NotificationType.QUOTATION_SUBMITTED,
                "Buyer Notification",
                "For buyer only",
                NotificationEntityType.QUOTATION,
                UUID.randomUUID()
        );

        // Supplier attempts to mark buyer's notification as read
        mockMvc.perform(put("/api/v1/notifications/" + buyerNotif.getId() + "/read")
                        .header("Authorization", supplierToken))
                .andExpect(status().isNotFound());

        // Verify buyer's notification remains unread in database
        Notification refreshed = notificationRepository.findById(buyerNotif.getId()).orElseThrow();
        assertFalse(refreshed.isRead());
    }

    @Test
    @DisplayName("6. Read-all only marks the authenticated user's notifications as read")
    public void testReadAll_OnlyAffectsAuthenticatedUser() throws Exception {
        Notification buyerNotif = notificationService.createNotification(
                buyer.getId(),
                NotificationType.QUOTATION_SUBMITTED,
                "Buyer Notif",
                "Body",
                NotificationEntityType.QUOTATION,
                UUID.randomUUID()
        );
        Notification supplierNotif = notificationService.createNotification(
                supplier.getId(),
                NotificationType.RFQ_SUBMITTED,
                "Supplier Notif",
                "Body",
                NotificationEntityType.RFQ,
                UUID.randomUUID()
        );

        // Buyer triggers mark all as read
        mockMvc.perform(put("/api/v1/notifications/read-all")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));

        // Buyer notification is read, Supplier notification remains UNREAD
        assertTrue(notificationRepository.findById(buyerNotif.getId()).orElseThrow().isRead());
        assertFalse(notificationRepository.findById(supplierNotif.getId()).orElseThrow().isRead());
    }

    @Test
    @DisplayName("7. IDOR Protection: Preferences are strictly derived from JWT identity")
    public void testPreferences_ScopedToAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/notification-preferences")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferences", hasSize(greaterThanOrEqualTo(9))))
                .andExpect(jsonPath("$.preferences[?(@.category=='SECURITY')].mandatory").value(hasItem(true)))
                .andExpect(jsonPath("$.preferences[?(@.category=='RFQ')].mandatory").value(hasItem(false)));
    }

    @Test
    @DisplayName("8. Mandatory categories (SECURITY, ACCOUNT) cannot be disabled by user")
    public void testMandatoryCategories_CannotBeDisabled() throws Exception {
        BulkUpdateNotificationPreferencesRequest request = new BulkUpdateNotificationPreferencesRequest(
                List.of(
                        new UpdateNotificationPreferenceRequest(NotificationCategory.SECURITY, false, false)
                )
        );

        mockMvc.perform(put("/api/v1/users/me/notification-preferences")
                        .header("Authorization", buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("9. Non-mandatory categories can be toggled via preferences")
    public void testNonMandatoryCategories_CanBeUpdated() throws Exception {
        BulkUpdateNotificationPreferencesRequest request = new BulkUpdateNotificationPreferencesRequest(
                List.of(
                        new UpdateNotificationPreferenceRequest(NotificationCategory.RFQ, true, false),
                        new UpdateNotificationPreferenceRequest(NotificationCategory.SHIPMENT, false, true)
                )
        );

        mockMvc.perform(put("/api/v1/users/me/notification-preferences")
                        .header("Authorization", buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferences[?(@.category=='RFQ')].emailEnabled").value(hasItem(false)))
                .andExpect(jsonPath("$.preferences[?(@.category=='SHIPMENT')].inAppEnabled").value(hasItem(false)));
    }

    @Test
    @DisplayName("10. Admin operations endpoints reject non-admin users with 403")
    public void testAdminEndpoints_RejectNonAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/admin/operations/platform-snapshot")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/operations/platform-snapshot")
                        .header("Authorization", supplierToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/admin/operations/platform-snapshot")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.communication.totalNotifications").exists());
    }

    @Test
    @DisplayName("11. Bounded pagination: page size is clamped safely to maximum 100")
    public void testBoundedPagination_ClampsTo100() throws Exception {
        mockMvc.perform(get("/api/v1/notifications?size=500")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    @DisplayName("12. Notification payload sanitization: zero password hashes or tokens exposed")
    public void testNotificationPayload_Sanitized() throws Exception {
        notificationService.createNotification(
                buyer.getId(),
                NotificationType.QUOTATION_SUBMITTED,
                "Quotation Alert",
                "Quotation received",
                NotificationEntityType.QUOTATION,
                UUID.randomUUID()
        );

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].passwordHash").doesNotExist())
                .andExpect(jsonPath("$.content[0].recipientEmail").doesNotExist())
                .andExpect(jsonPath("$.content[0].recipientId").doesNotExist())
                .andExpect(jsonPath("$.content[0].targetRoute").exists());
    }

    @Test
    @DisplayName("13. Safe Server-Side Deep Links: prevents arbitrary redirection injection")
    public void testDeepLinkResolution_SafeServerSide() throws Exception {
        UUID orderId = UUID.randomUUID();
        notificationService.createNotification(
                buyer.getId(),
                NotificationType.ORDER_SHIPPED,
                "Order Shipped",
                "Carrier tracking available",
                NotificationEntityType.PURCHASE_ORDER,
                orderId
        );

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].targetRoute").value("/dashboard/orders/" + orderId));
    }

    @Test
    @DisplayName("14. Filtering notifications by category and read status works correctly")
    public void testNotificationFiltering_CategoryAndRead() throws Exception {
        notificationService.createNotification(
                buyer.getId(),
                NotificationType.RFQ_SUBMITTED,
                "RFQ Notice",
                "RFQ Notice body",
                NotificationEntityType.RFQ,
                UUID.randomUUID()
        );
        notificationService.createNotification(
                buyer.getId(),
                NotificationType.PURCHASE_ORDER_CREATED,
                "Order Notice",
                "Order created body",
                NotificationEntityType.PURCHASE_ORDER,
                UUID.randomUUID()
        );

        // Filter by category=RFQ
        mockMvc.perform(get("/api/v1/notifications?category=RFQ")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].category").value("RFQ"));

        // Filter by category=PURCHASE_ORDER
        mockMvc.perform(get("/api/v1/notifications?category=PURCHASE_ORDER")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].category").value("PURCHASE_ORDER"));
    }

    @Test
    @DisplayName("15. Unread count endpoint returns accurate unread count for authenticated user")
    public void testUnreadCount_ReturnsAccurateCount() throws Exception {
        Notification n1 = notificationService.createNotification(
                buyer.getId(),
                NotificationType.RFQ_SUBMITTED,
                "N1",
                "B1",
                NotificationEntityType.RFQ,
                UUID.randomUUID()
        );
        Notification n2 = notificationService.createNotification(
                buyer.getId(),
                NotificationType.QUOTATION_SUBMITTED,
                "N2",
                "B2",
                NotificationEntityType.QUOTATION,
                UUID.randomUUID()
        );

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));

        // Mark n1 as read
        mockMvc.perform(put("/api/v1/notifications/" + n1.getId() + "/read")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));
    }
}

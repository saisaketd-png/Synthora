package com.synthora.notification;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synthora.identity.User;
import com.synthora.identity.UserRepository;
import com.synthora.identity.UserRole;
import com.synthora.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class NotificationApiSecurityTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private NotificationService notificationService;
    @Autowired private UserRepository userRepository;
    @Autowired private JwtService jwtService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private ObjectMapper objectMapper;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

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
        tokenA = "Bearer " + jwtService.generateToken(userA);

        userB = new User();
        userB.setEmail("userb@synthora.com");
        userB.setName("User B");
        userB.setPasswordHash("hash");
        userB.setRole(UserRole.SUPPLIER);
        userB = userRepository.save(userB);
        tokenB = "Bearer " + jwtService.generateToken(userB);
    }

    @Test
    public void testGetNotifications_Unauthenticated_Rejected() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    public void testGetNotifications_Authenticated_ReturnsOnlyOwnNotifications() throws Exception {
        notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "Title A1", "Msg A1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "Title A2", "Msg A2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());
        notificationService.createNotification(userB.getId(), NotificationType.PO_CONFIRMED, "Title B1", "Msg B1", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.content[0].title", notNullValue()))
                .andExpect(jsonPath("$.content[0].recipientId").doesNotExist())
                .andExpect(jsonPath("$.totalElements", is(2)));

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title", is("Title B1")))
                .andExpect(jsonPath("$.totalElements", is(1)));
    }

    @Test
    public void testGetNotifications_IgnoringInjectedRecipientIdParam() throws Exception {
        notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "Title A1", "Msg A1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userB.getId(), NotificationType.PO_CONFIRMED, "Title B1", "Msg B1", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        // User A tries to pass recipientId of User B in query params
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", tokenA)
                        .param("recipientId", userB.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(1)))
                .andExpect(jsonPath("$.content[0].title", is("Title A1")));
    }

    @Test
    public void testGetUnreadCount_Authenticated() throws Exception {
        notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "T1", "M1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "T2", "M2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count", is(2)));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count", is(0)));
    }

    @Test
    public void testMarkAsRead_OwnNotification_Success() throws Exception {
        Notification n = notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "T", "M", NotificationEntityType.RFQ, UUID.randomUUID());

        mockMvc.perform(put("/api/v1/notifications/" + n.getId() + "/read")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(n.getId().toString())))
                .andExpect(jsonPath("$.read", is(true)))
                .andExpect(jsonPath("$.readAt", notNullValue()));
    }

    @Test
    public void testMarkAsRead_OtherUserNotification_Returns404() throws Exception {
        Notification n = notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "T", "M", NotificationEntityType.RFQ, UUID.randomUUID());

        // User B tries to mark User A's notification as read
        mockMvc.perform(put("/api/v1/notifications/" + n.getId() + "/read")
                        .header("Authorization", tokenB))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testMarkAllAsRead_Authenticated() throws Exception {
        notificationService.createNotification(userA.getId(), NotificationType.RFQ_SUBMITTED, "T1", "M1", NotificationEntityType.RFQ, UUID.randomUUID());
        notificationService.createNotification(userA.getId(), NotificationType.PO_ISSUED, "T2", "M2", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());
        notificationService.createNotification(userB.getId(), NotificationType.PO_CONFIRMED, "T3", "M3", NotificationEntityType.PURCHASE_ORDER, UUID.randomUUID());

        mockMvc.perform(put("/api/v1/notifications/read-all")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count", is(2)));

        // Verify User A unread is 0 and User B unread is still 1
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count", is(0)));

        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count", is(1)));
    }
}

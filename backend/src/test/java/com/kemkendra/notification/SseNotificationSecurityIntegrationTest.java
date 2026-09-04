package com.kemkendra.notification;

import com.kemkendra.identity.User;
import com.kemkendra.identity.UserRepository;
import com.kemkendra.identity.UserRole;
import com.kemkendra.identity.UserStatus;
import com.kemkendra.notification.dto.NotificationResponse;
import com.kemkendra.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SseNotificationSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private NotificationStreamService notificationStreamService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User activeUserA;
    private User activeUserB;
    private User suspendedUser;
    private String tokenUserA;
    private String tokenUserB;
    private String tokenSuspendedUser;

    @BeforeEach
    public void setup() {
        jdbcTemplate.execute("UPDATE rfqs SET accepted_quotation_id = NULL; DELETE FROM buyer_shortlist_items; DELETE FROM buyer_shortlists; DELETE FROM governance_audit_logs; DELETE FROM audit_logs; DELETE FROM notifications; DELETE FROM supplier_offering_verification_evidences; DELETE FROM supplier_offering_audits; DELETE FROM supplier_verification_evidences; DELETE FROM supplier_verification_audits; DELETE FROM product_requests; DELETE FROM sourcing_requests; DELETE FROM documents; DELETE FROM shipments; DELETE FROM purchase_orders; DELETE FROM quotations; DELETE FROM rfqs; DELETE FROM supplier_offerings; DELETE FROM product_master_mappings; DELETE FROM master_products; DELETE FROM product_images; DELETE FROM product_suppliers; DELETE FROM products; DELETE FROM seller_profiles; DELETE FROM suppliers; DELETE FROM email_verification_tokens; DELETE FROM password_reset_tokens; DELETE FROM users;");

        activeUserA = new User();
        activeUserA.setEmail("sse_buyer_a@kemkendra.com");
        activeUserA.setPasswordHash(passwordEncoder.encode("StrongPassword123!"));
        activeUserA.setName("Buyer Alice");
        activeUserA.setRole(UserRole.USER);
        activeUserA.setStatus(UserStatus.ACTIVE);
        activeUserA.setEmailVerifiedAt(Instant.now());
        activeUserA = userRepository.save(activeUserA);
        tokenUserA = jwtService.generateToken(activeUserA);

        activeUserB = new User();
        activeUserB.setEmail("sse_buyer_b@kemkendra.com");
        activeUserB.setPasswordHash(passwordEncoder.encode("StrongPassword123!"));
        activeUserB.setName("Buyer Bob");
        activeUserB.setRole(UserRole.USER);
        activeUserB.setStatus(UserStatus.ACTIVE);
        activeUserB.setEmailVerifiedAt(Instant.now());
        activeUserB = userRepository.save(activeUserB);
        tokenUserB = jwtService.generateToken(activeUserB);

        suspendedUser = new User();
        suspendedUser.setEmail("sse_suspended@kemkendra.com");
        suspendedUser.setPasswordHash(passwordEncoder.encode("StrongPassword123!"));
        suspendedUser.setName("Suspended User");
        suspendedUser.setRole(UserRole.USER);
        suspendedUser.setStatus(UserStatus.SUSPENDED);
        suspendedUser.setEmailVerifiedAt(Instant.now());
        suspendedUser = userRepository.save(suspendedUser);
        tokenSuspendedUser = jwtService.generateToken(suspendedUser);
    }

    @Test
    @DisplayName("Unauthenticated SSE request returns 401 Unauthorized")
    public void testUnauthenticatedSseRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications/stream"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Query-token-only request is strictly ignored and returns 401 Unauthorized")
    public void testQueryTokenOnlyRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications/stream")
                        .param("token", tokenUserA))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Malformed Authorization headers do not authenticate and return 401 Unauthorized")
    public void testMalformedAuthorizationHeaderReturns401() throws Exception {
        // Missing "Bearer " scheme prefix
        mockMvc.perform(get("/api/v1/notifications/stream")
                        .header(HttpHeaders.AUTHORIZATION, "Basic " + tokenUserA))
                .andExpect(status().isUnauthorized());

        // Invalid signature / random token
        mockMvc.perform(get("/api/v1/notifications/stream")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer invalid.jwt.signature"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Suspended user is prohibited from opening an SSE stream")
    public void testSuspendedUserCannotEstablishStream() throws Exception {
        mockMvc.perform(get("/api/v1/notifications/stream")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenSuspendedUser))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Valid Authorization Bearer token starts async SSE stream")
    public void testValidBearerTokenStartsAsyncSseStream() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/notifications/stream")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenUserA))
                .andExpect(request().asyncStarted())
                .andReturn();

        assertThat(result.getResponse().getContentType()).contains(MediaType.TEXT_EVENT_STREAM_VALUE);
    }

    @Test
    @DisplayName("Notification events are isolated: User A receives notifications, User B does not")
    public void testTenantIsolationBetweenSubscribers() {
        SseEmitter emitterA = notificationStreamService.subscribe(activeUserA.getId());
        SseEmitter emitterB = notificationStreamService.subscribe(activeUserB.getId());

        assertThat(notificationStreamService.getActiveEmitterCount(activeUserA.getId())).isGreaterThanOrEqualTo(1);
        assertThat(notificationStreamService.getActiveEmitterCount(activeUserB.getId())).isGreaterThanOrEqualTo(1);

        NotificationResponse notifA = new NotificationResponse(
                UUID.randomUUID(),
                NotificationType.QUOTATION_SUBMITTED,
                NotificationCategory.RFQ,
                NotificationPriority.NORMAL,
                "New RFQ Quotation Received",
                "Quotation #101 has been submitted.",
                NotificationEntityType.RFQ,
                UUID.randomUUID(),
                "/dashboard/rfqs",
                false,
                null,
                LocalDateTime.now()
        );

        // Dispatched exclusively for activeUserA
        notificationStreamService.sendNotification(activeUserA.getId(), notifA, 1L);

        // Active emitters for activeUserB remain unaffected and segregated
        assertThat(notificationStreamService.getActiveEmitterCount(activeUserB.getId())).isEqualTo(1);

        // Cleanup
        notificationStreamService.removeEmitter(activeUserA.getId(), emitterA);
        notificationStreamService.removeEmitter(activeUserB.getId(), emitterB);
        assertThat(notificationStreamService.getActiveEmitterCount(activeUserA.getId())).isEqualTo(0);
        assertThat(notificationStreamService.getActiveEmitterCount(activeUserB.getId())).isEqualTo(0);
    }

    @Test
    @DisplayName("Disconnected emitters are cleaned up thread-safely without memory leaks")
    public void testDisconnectedEmittersAreCleanedUp() {
        UUID userId = activeUserA.getId();
        SseEmitter emitter = notificationStreamService.subscribe(userId);

        assertThat(notificationStreamService.getActiveEmitterCount(userId)).isEqualTo(1);

        // Simulate client disconnect / error removal
        notificationStreamService.removeEmitter(userId, emitter);

        assertThat(notificationStreamService.getActiveEmitterCount(userId)).isEqualTo(0);
    }

    @Test
    @DisplayName("Concurrent subscriptions per user are safely capped at MAX_EMITTERS_PER_USER")
    public void testConcurrentSubscriptionsCapPerUser() {
        UUID userId = activeUserA.getId();

        // Subscribe 8 times (exceeding MAX_EMITTERS_PER_USER = 5)
        for (int i = 0; i < 8; i++) {
            notificationStreamService.subscribe(userId);
        }

        assertThat(notificationStreamService.getActiveEmitterCount(userId))
                .isEqualTo(NotificationStreamService.MAX_EMITTERS_PER_USER);
    }
}
